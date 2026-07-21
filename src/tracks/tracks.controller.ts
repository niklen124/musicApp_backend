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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TracksService } from './tracks.service';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { trackFileStorage, audioFileFilter } from './multer.config';

@Controller('tracks')
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  findAll() {
    return this.tracksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tracksService.findOne(id);
  }

  // Incrémente le compteur d'écoutes. N'importe quel utilisateur connecté
  // peut déclencher ça (juste besoin d'être authentifié, pas de rôle spécifique).
  @UseGuards(JwtAuthGuard)
  @Post(':id/play')
  play(@Param('id') id: string) {
    return this.tracksService.incrementPlayCount(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ARTIST')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: trackFileStorage,
      fileFilter: audioFileFilter,
      limits: { fileSize: 20 * 1024 * 1024 }, // 20 Mo max
    }),
  )
  create(
    @Body() createTrackDto: CreateTrackDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Un fichier audio est requis');
    }
    const fileUrl = `/uploads/tracks/${file.filename}`;
    return this.tracksService.create(createTrackDto, fileUrl);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ARTIST')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTrackDto: UpdateTrackDto) {
    return this.tracksService.update(id, updateTrackDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tracksService.remove(id);
  }
}
