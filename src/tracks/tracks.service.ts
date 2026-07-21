import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';

@Injectable()
export class TracksService {
  constructor(private readonly databaseService: DatabaseService) {}

  private async assertRelationsExist(dto: {
    artistId?: string;
    albumId?: string;
    genreId?: string;
  }) {
    if (dto.artistId) {
      const artist = await this.databaseService.artist.findUnique({
        where: { id: dto.artistId },
      });
      if (!artist) {
        throw new NotFoundException(`Artiste ${dto.artistId} introuvable`);
      }
    }

    if (dto.albumId) {
      const album = await this.databaseService.album.findUnique({
        where: { id: dto.albumId },
      });
      if (!album) {
        throw new NotFoundException(`Album ${dto.albumId} introuvable`);
      }
    }

    if (dto.genreId) {
      const genre = await this.databaseService.genre.findUnique({
        where: { id: dto.genreId },
      });
      if (!genre) {
        throw new NotFoundException(`Genre ${dto.genreId} introuvable`);
      }
    }
  }

  async create(createTrackDto: CreateTrackDto, fileUrl: string) {
    await this.assertRelationsExist(createTrackDto);

    return this.databaseService.track.create({
      data: { ...createTrackDto, fileUrl },
    });
  }

  findAll() {
    return this.databaseService.track.findMany({
      include: { artist: true, album: true, genre: true },
    });
  }

  async findOne(id: string) {
    const track = await this.databaseService.track.findUnique({
      where: { id },
      include: { artist: true, album: true, genre: true },
    });
    if (!track) {
      throw new NotFoundException(`Track ${id} introuvable`);
    }
    return track;
  }

  async update(id: string, updateTrackDto: UpdateTrackDto) {
    await this.findOne(id);
    await this.assertRelationsExist(updateTrackDto);

    return this.databaseService.track.update({
      where: { id },
      data: updateTrackDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.databaseService.track.delete({ where: { id } });
  }

  // Appelé quand la lecture d'un morceau démarre côté player
  async incrementPlayCount(id: string) {
    await this.findOne(id);
    return this.databaseService.track.update({
      where: { id },
      data: { playCount: { increment: 1 } },
    });
  }
}
