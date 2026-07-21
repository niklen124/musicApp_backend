import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTrackDto } from './dto/add-track.dto';
import { ReorderPlaylistDto } from './dto/reorder-playlist.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: number; role: string };
}

interface OptionalAuthRequest extends Request {
  user?: { id: number; role: string };
}

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(req.user.id, dto);
  }

  // Public : playlists publiques + celles de l'utilisateur connecté s'il y en a un
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  findAll(@Req() req: OptionalAuthRequest) {
    return this.playlistsService.findAll(req.user?.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: OptionalAuthRequest) {
    return this.playlistsService.findOne(id, req.user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, req.user.id, req.user.role, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.playlistsService.remove(id, req.user.id, req.user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/tracks')
  addTrack(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddTrackDto,
  ) {
    return this.playlistsService.addTrack(
      id,
      req.user.id,
      req.user.role,
      dto.trackId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/tracks/:trackId')
  removeTrack(
    @Param('id') id: string,
    @Param('trackId') trackId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.playlistsService.removeTrack(
      id,
      req.user.id,
      req.user.role,
      trackId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reorder')
  reorder(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ReorderPlaylistDto,
  ) {
    return this.playlistsService.reorder(
      id,
      req.user.id,
      req.user.role,
      dto.fromPos,
      dto.toPos,
    );
  }
}
