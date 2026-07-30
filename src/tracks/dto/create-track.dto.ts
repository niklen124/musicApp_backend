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

  // Optionnel : la vraie durée est désormais détectée automatiquement depuis
  // le fichier audio uploadé (voir TracksService.getAudioDuration). Ce champ
  // ne sert plus que de fallback si jamais la détection échoue.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationSeconds?: number;

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
