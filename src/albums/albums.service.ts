import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createAlbumDto: CreateAlbumDto) {
    // Vérifie que l'artiste existe avant de créer l'album, pour un message
    // d'erreur clair plutôt qu'une erreur Prisma de contrainte de clé étrangère
    const artist = await this.databaseService.artist.findUnique({
      where: { id: createAlbumDto.artistId },
    });
    if (!artist) {
      throw new NotFoundException(
        `Artiste ${createAlbumDto.artistId} introuvable`,
      );
    }

    return this.databaseService.album.create({ data: createAlbumDto });
  }

  findAll(artistId?: string) {
    return this.databaseService.album.findMany({
      where: artistId ? { artistId } : undefined,
      include: { artist: true },
    });
  }

  async findOne(id: string) {
    const album = await this.databaseService.album.findUnique({
      where: { id },
      include: { artist: true, tracks: true },
    });
    if (!album) {
      throw new NotFoundException(`Album ${id} introuvable`);
    }
    return album;
  }

  // Tracklist d'un album, avec artist/genre inclus pour que le frontend
  // (TrackRow, PlayerBar) ait tout ce qu'il lui faut sans requête supplémentaire.
  async findTracks(albumId: string) {
    await this.findOne(albumId); // 404 clair si l'album n'existe pas

    return this.databaseService.track.findMany({
      where: { albumId },
      include: { artist: true, genre: true },
      orderBy: { uploadedAt: 'asc' },
    });
  }

  async update(id: string, updateAlbumDto: UpdateAlbumDto) {
    await this.findOne(id);

    if (updateAlbumDto.artistId) {
      const artist = await this.databaseService.artist.findUnique({
        where: { id: updateAlbumDto.artistId },
      });
      if (!artist) {
        throw new NotFoundException(
          `Artiste ${updateAlbumDto.artistId} introuvable`,
        );
      }
    }

    return this.databaseService.album.update({
      where: { id },
      data: updateAlbumDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.databaseService.album.delete({ where: { id } });
  }
}
