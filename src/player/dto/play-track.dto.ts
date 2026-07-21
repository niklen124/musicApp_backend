import { IsString, IsOptional } from 'class-validator';

export class PlayTrackDto {
  @IsOptional()
  @IsString()
  trackId?: string;
}
