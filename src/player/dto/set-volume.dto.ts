import { IsInt, Min, Max } from 'class-validator';

export class SetVolumeDto {
  @IsInt()
  @Min(0)
  @Max(100)
  volume: number;
}
