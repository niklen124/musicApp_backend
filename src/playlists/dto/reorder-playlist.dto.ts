import { IsInt, Min } from 'class-validator';

export class ReorderPlaylistDto {
  @IsInt()
  @Min(0)
  fromPos: number;

  @IsInt()
  @Min(0)
  toPos: number;
}
