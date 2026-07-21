import { IsString } from 'class-validator';

export class AddQueueTrackDto {
  @IsString()
  trackId: string;
}
