import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTrackDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  // Vient en multipart/form-data (string) donc @Type(() => Number) pour convertir
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds: number;

  @IsString()
  artistId: string;

  @IsOptional()
  @IsString()
  albumId?: string;

  @IsString()
  genreId: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
