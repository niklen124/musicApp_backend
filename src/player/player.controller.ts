import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PlayerService } from './player.service';
import { PlayTrackDto } from './dto/play-track.dto';
import { SetVolumeDto } from './dto/set-volume.dto';
import { SeekDto } from './dto/seek.dto';
import { RepeatModeDto } from './dto/repeat-mode.dto';
import { ShuffleDto } from './dto/shuffle.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: number; role: string };
}

@Controller('player')
@UseGuards(JwtAuthGuard) // toutes les routes de ce controller exigent d'être connecté
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get()
  getPlayer(@Req() req: AuthenticatedRequest) {
    return this.playerService.getPlayer(req.user.id);
  }

  @Post('play')
  play(@Req() req: AuthenticatedRequest, @Body() dto: PlayTrackDto) {
    return this.playerService.play(req.user.id, dto.trackId);
  }

  @Post('pause')
  pause(@Req() req: AuthenticatedRequest) {
    return this.playerService.pause(req.user.id);
  }

  @Post('next')
  next(@Req() req: AuthenticatedRequest) {
    return this.playerService.next(req.user.id);
  }

  @Post('previous')
  previous(@Req() req: AuthenticatedRequest) {
    return this.playerService.previous(req.user.id);
  }

  @Patch('volume')
  setVolume(@Req() req: AuthenticatedRequest, @Body() dto: SetVolumeDto) {
    return this.playerService.setVolume(req.user.id, dto.volume);
  }

  @Patch('seek')
  seek(@Req() req: AuthenticatedRequest, @Body() dto: SeekDto) {
    return this.playerService.seek(req.user.id, dto.positionSeconds);
  }

  @Patch('repeat-mode')
  setRepeatMode(@Req() req: AuthenticatedRequest, @Body() dto: RepeatModeDto) {
    return this.playerService.setRepeatMode(req.user.id, dto.repeatMode);
  }

  @Patch('shuffle')
  setShuffle(@Req() req: AuthenticatedRequest, @Body() dto: ShuffleDto) {
    return this.playerService.setShuffle(req.user.id, dto.shuffle);
  }
}
