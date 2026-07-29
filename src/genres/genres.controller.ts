import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GenresService } from './genres.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import {
  imageFileStorage,
  imageFileFilter,
} from 'src/common/multer-image.config';

@Controller('genres')
export class GenresController {
  constructor(private readonly genresService: GenresService) {}

  // Lecture publique : pas de guard, tout le monde peut consulter les genres
  @Get()
  findAll() {
    return this.genresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.genresService.findOne(id);
  }

  // Écriture réservée aux admins
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  @UseInterceptors(
    FileInterceptor('coverFile', {
      storage: imageFileStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() createGenreDto: CreateGenreDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    if (coverFile) {
      createGenreDto.coverUrl = `/uploads/images/${coverFile.filename}`;
    }
    return this.genresService.create(createGenreDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('coverFile', {
      storage: imageFileStorage,
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateGenreDto: UpdateGenreDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    if (coverFile) {
      updateGenreDto.coverUrl = `/uploads/images/${coverFile.filename}`;
    }
    return this.genresService.update(id, updateGenreDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.genresService.remove(id);
  }
}
