import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { QueueService } from './queue.service';
import { AddQueueTrackDto } from './dto/add-queue-track.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: { id: number; role: string };
}

@Controller('queue')
@UseGuards(JwtAuthGuard)
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  getQueue(@Req() req: AuthenticatedRequest) {
    return this.queueService.getQueue(req.user.id);
  }

  @Post('tracks')
  push(@Req() req: AuthenticatedRequest, @Body() dto: AddQueueTrackDto) {
    return this.queueService.push(req.user.id, dto.trackId);
  }

  @Delete('tracks/:trackId')
  removeTrack(
    @Req() req: AuthenticatedRequest,
    @Param('trackId') trackId: string,
  ) {
    return this.queueService.removeTrack(req.user.id, trackId);
  }

  @Post('shuffle')
  shuffle(@Req() req: AuthenticatedRequest) {
    return this.queueService.shuffleQueue(req.user.id);
  }

  @Delete()
  clear(@Req() req: AuthenticatedRequest) {
    return this.queueService.clear(req.user.id);
  }
}
