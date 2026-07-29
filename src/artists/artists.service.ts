import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ArtistsService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createArtistDto: CreateArtistDto) {
    return this.databaseService.artist.create({ data: createArtistDto });
  }

  findAll() {
    return this.databaseService.artist.findMany();
  }

  async findOne(id: string) {
    const artist = await this.databaseService.artist.findUnique({
      where: { id },
      include: {
        albums: true,
        tracks: {
          include: {
            album: true,
            genre: true,
          },
        },
      },
    });
    if (!artist) {
      throw new NotFoundException(`Artist ${id} introuvable`);
    }

    return artist;
  }

  async update(id: string, updateArtistDto: UpdateArtistDto) {
    await this.findOne(id);
    return this.databaseService.artist.update({
      where: { id },
      data: updateArtistDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.databaseService.artist.delete({ where: { id } });
  }
}
