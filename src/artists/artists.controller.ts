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
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import {
  imageFileStorage,
  imageFileFilter,
} from 'src/common/multer-image.config';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatarFile', maxCount: 1 },
        { name: 'coverFile', maxCount: 1 },
      ],
      {
        storage: imageFileStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  create(
    @Body() createArtistDto: CreateArtistDto,
    @UploadedFiles()
    files: {
      avatarFile?: Express.Multer.File[];
      coverFile?: Express.Multer.File[];
    },
  ) {
    const avatarUrl = files?.avatarFile?.[0]
      ? `/uploads/images/${files.avatarFile[0].filename}`
      : createArtistDto.avatarUrl;
    const coverUrl = files?.coverFile?.[0]
      ? `/uploads/images/${files.coverFile[0].filename}`
      : createArtistDto.coverUrl;

    return this.artistsService.create({
      ...createArtistDto,
      avatarUrl,
      coverUrl,
    });
  }

  @Get()
  findAll() {
    return this.artistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'avatarFile', maxCount: 1 },
        { name: 'coverFile', maxCount: 1 },
      ],
      {
        storage: imageFileStorage,
        fileFilter: imageFileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateArtistDto: UpdateArtistDto,
    @UploadedFiles()
    files: {
      avatarFile?: Express.Multer.File[];
      coverFile?: Express.Multer.File[];
    },
  ) {
    if (files?.avatarFile?.[0]) {
      updateArtistDto.avatarUrl = `/uploads/images/${files.avatarFile[0].filename}`;
    }
    if (files?.coverFile?.[0]) {
      updateArtistDto.coverUrl = `/uploads/images/${files.coverFile[0].filename}`;
    }
    return this.artistsService.update(id, updateArtistDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.artistsService.remove(id);
  }
}
