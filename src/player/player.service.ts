import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class PlayerService {
  constructor(private readonly databaseService: DatabaseService) {}

  // Le player (et sa queue) n'existent pas forcément dès l'inscription :
  // on les crée à la volée au premier accès (upsert).
  private async getOrCreatePlayer(userId: number) {
    const player = await this.databaseService.player.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { currentTrack: true },
    });

    await this.databaseService.queue.upsert({
      where: { playerId: userId },
      create: { playerId: userId },
      update: {},
    });

    return player;
  }

  async getPlayer(userId: number) {
    return this.getOrCreatePlayer(userId);
  }

  async play(userId: number, trackId?: string) {
    await this.getOrCreatePlayer(userId);

    if (trackId) {
      const track = await this.databaseService.track.findUnique({
        where: { id: trackId },
      });
      if (!track) {
        throw new NotFoundException(`Track ${trackId} introuvable`);
      }

      await this.databaseService.track.update({
        where: { id: trackId },
        data: { playCount: { increment: 1 } },
      });

      return this.databaseService.player.update({
        where: { userId },
        data: {
          currentTrackId: trackId,
          positionSeconds: 0,
          isPlaying: true,
        },
        include: { currentTrack: true },
      });
    }

    // Pas de trackId : on reprend juste la lecture en cours
    const player = await this.databaseService.player.findUnique({
      where: { userId },
    });
    if (!player?.currentTrackId) {
      throw new BadRequestException(
        'Aucun morceau en cours : précisez un trackId',
      );
    }

    return this.databaseService.player.update({
      where: { userId },
      data: { isPlaying: true },
      include: { currentTrack: true },
    });
  }

  async pause(userId: number) {
    await this.getOrCreatePlayer(userId);
    return this.databaseService.player.update({
      where: { userId },
      data: { isPlaying: false },
    });
  }

  // Cherche le morceau suivant/précédent dans la queue, en tenant compte
  // du repeatMode ("all" boucle sur la file, "none" s'arrête au bout).
  private async navigateQueue(userId: number, direction: 1 | -1) {
    const player = await this.getOrCreatePlayer(userId);

    const queue = await this.databaseService.queue.findUnique({
      where: { playerId: userId },
      include: { tracks: { orderBy: { position: 'asc' } } },
    });

    if (!queue || queue.tracks.length === 0) {
      throw new NotFoundException('La file de lecture est vide');
    }

    let nextIndex = queue.currentIndex + direction;

    if (nextIndex < 0 || nextIndex >= queue.tracks.length) {
      if (player.repeatMode === 'all') {
        nextIndex = (nextIndex + queue.tracks.length) % queue.tracks.length;
      } else {
        throw new BadRequestException(
          direction === 1
            ? 'Fin de la file de lecture'
            : 'Début de la file de lecture',
        );
      }
    }

    const nextQueueTrack = queue.tracks[nextIndex];

    await this.databaseService.queue.update({
      where: { playerId: userId },
      data: { currentIndex: nextIndex },
    });

    return this.databaseService.player.update({
      where: { userId },
      data: {
        currentTrackId: nextQueueTrack.trackId,
        positionSeconds: 0,
        isPlaying: true,
      },
      include: { currentTrack: true },
    });
  }

  next(userId: number) {
    return this.navigateQueue(userId, 1);
  }

  previous(userId: number) {
    return this.navigateQueue(userId, -1);
  }

  async setVolume(userId: number, volume: number) {
    await this.getOrCreatePlayer(userId);
    return this.databaseService.player.update({
      where: { userId },
      data: { volume },
    });
  }

  async seek(userId: number, positionSeconds: number) {
    const player = await this.getOrCreatePlayer(userId);
    if (!player.currentTrackId) {
      throw new BadRequestException('Aucun morceau en cours de lecture');
    }
    return this.databaseService.player.update({
      where: { userId },
      data: { positionSeconds },
    });
  }

  async setRepeatMode(userId: number, repeatMode: string) {
    await this.getOrCreatePlayer(userId);
    return this.databaseService.player.update({
      where: { userId },
      data: { repeatMode },
    });
  }

  async setShuffle(userId: number, shuffle: boolean) {
    await this.getOrCreatePlayer(userId);
    return this.databaseService.player.update({
      where: { userId },
      data: { shuffle },
    });
  }
}
