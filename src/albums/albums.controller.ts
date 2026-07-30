import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import {
  imageFileStorage,
  imageFileFilter,
} from 'src/common/multer-image.config';

@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  // Lecture publique. ?artistId=... permet de filtrer les albums d'un artiste
  // (couvre le besoin de GET /artists/:id/albums sans dupliquer la logique)
  @Get()
  findAll(@Query('artistId') artistId?: string) {
    return this.albumsService.findAll(artistId);
  }

  // IMPORTANT : cette route doit rester déclarée AVANT @Get(':id'),
  // sinon NestJS matcherait ":id" avec la valeur "xxxx-xxxx/tracks"
  // et cette route ne serait jamais atteinte.
  @Get(':id/tracks')
  findTracks(@Param('id') id: string) {
    return this.albumsService.findTracks(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.albumsService.findOne(id);
  }

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
    @Body() createAlbumDto: CreateAlbumDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    if (coverFile) {
      createAlbumDto.coverUrl = `/uploads/images/${coverFile.filename}`;
    }
    return this.albumsService.create(createAlbumDto);
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
    @Body() updateAlbumDto: UpdateAlbumDto,
    @UploadedFile() coverFile?: Express.Multer.File,
  ) {
    if (coverFile) {
      updateAlbumDto.coverUrl = `/uploads/images/${coverFile.filename}`;
    }
    return this.albumsService.update(id, updateAlbumDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.albumsService.remove(id);
  }
}
