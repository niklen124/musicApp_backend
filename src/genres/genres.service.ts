import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Injectable()
export class GenresService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createGenreDto: CreateGenreDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.databaseService.genre.create({ data: createGenreDto });
  }

  findAll() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.databaseService.genre.findMany();
  }

  async findOne(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const genre = await this.databaseService.genre.findUnique({
      where: { id },
    });
    if (!genre) {
      throw new NotFoundException(`Genre ${id} introuvable`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    await this.findOne(id); // vérifie que le genre existe, sinon 404 clair
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.databaseService.genre.update({
      where: { id },
      data: updateGenreDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return this.databaseService.genre.delete({ where: { id } });
  }
}
