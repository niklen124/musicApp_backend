import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@Injectable()
export class PlaylistsService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(ownerId: number, dto: CreatePlaylistDto) {
    return this.databaseService.playlist.create({
      data: { ...dto, ownerId },
    });
  }

  // Liste des playlists visibles : publiques + celles de l'utilisateur connecté (s'il y en a un)
  findAll(currentUserId?: number) {
    return this.databaseService.playlist.findMany({
      where: currentUserId
        ? { OR: [{ isPublic: true }, { ownerId: currentUserId }] }
        : { isPublic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, currentUserId?: number) {
    const playlist = await this.databaseService.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          orderBy: { position: 'asc' },
          include: { track: true },
        },
      },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist ${id} introuvable`);
    }
    if (!playlist.isPublic && playlist.ownerId !== currentUserId) {
      throw new ForbiddenException('Cette playlist est privée');
    }
    return playlist;
  }

  // Vérifie que l'utilisateur est propriétaire (ou admin), sinon throw.
  // Réutilisé par update/remove/addTrack/removeTrack/reorder.
  private async assertOwnership(
    playlistId: string,
    userId: number,
    userRole: string,
  ) {
    const playlist = await this.databaseService.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      throw new NotFoundException(`Playlist ${playlistId} introuvable`);
    }
    if (playlist.ownerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cette playlist",
      );
    }
    return playlist;
  }

  async update(
    id: string,
    userId: number,
    userRole: string,
    dto: UpdatePlaylistDto,
  ) {
    await this.assertOwnership(id, userId, userRole);
    return this.databaseService.playlist.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: number, userRole: string) {
    await this.assertOwnership(id, userId, userRole);
    return this.databaseService.playlist.delete({ where: { id } });
  }

  async addTrack(
    playlistId: string,
    userId: number,
    userRole: string,
    trackId: string,
  ) {
    await this.assertOwnership(playlistId, userId, userRole);

    const track = await this.databaseService.track.findUnique({
      where: { id: trackId },
    });
    if (!track) {
      throw new NotFoundException(`Track ${trackId} introuvable`);
    }

    const alreadyIn = await this.databaseService.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    if (alreadyIn) {
      throw new BadRequestException('Ce morceau est déjà dans la playlist');
    }

    const lastTrack = await this.databaseService.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { position: 'desc' },
    });
    const nextPosition = lastTrack ? lastTrack.position + 1 : 0;

    return this.databaseService.playlistTrack.create({
      data: { playlistId, trackId, position: nextPosition },
    });
  }

  async removeTrack(
    playlistId: string,
    userId: number,
    userRole: string,
    trackId: string,
  ) {
    await this.assertOwnership(playlistId, userId, userRole);

    const entry = await this.databaseService.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    if (!entry) {
      throw new NotFoundException("Ce morceau n'est pas dans la playlist");
    }

    return this.databaseService.$transaction(async (tx) => {
      await tx.playlistTrack.delete({
        where: { playlistId_trackId: { playlistId, trackId } },
      });
      // Décale les positions suivantes pour combler le trou
      await tx.playlistTrack.updateMany({
        where: { playlistId, position: { gt: entry.position } },
        data: { position: { decrement: 1 } },
      });
    });
  }

  async reorder(
    playlistId: string,
    userId: number,
    userRole: string,
    fromPos: number,
    toPos: number,
  ) {
    await this.assertOwnership(playlistId, userId, userRole);

    if (fromPos === toPos) return { message: 'Aucun changement' };

    const moved = await this.databaseService.playlistTrack.findFirst({
      where: { playlistId, position: fromPos },
    });
    if (!moved) {
      throw new NotFoundException(`Aucun morceau à la position ${fromPos}`);
    }

    return this.databaseService.$transaction(async (tx) => {
      if (fromPos < toPos) {
        // On déplace vers le bas : les morceaux entre les deux remontent d'un cran
        await tx.playlistTrack.updateMany({
          where: {
            playlistId,
            position: { gt: fromPos, lte: toPos },
          },
          data: { position: { decrement: 1 } },
        });
      } else {
        // On déplace vers le haut : les morceaux entre les deux descendent d'un cran
        await tx.playlistTrack.updateMany({
          where: {
            playlistId,
            position: { gte: toPos, lt: fromPos },
          },
          data: { position: { increment: 1 } },
        });
      }

      return tx.playlistTrack.update({
        where: {
          playlistId_trackId: { playlistId, trackId: moved.trackId },
        },
        data: { position: toPos },
      });
    });
  }
}
