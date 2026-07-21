import {
  IsString,
  IsInt,
  IsOptional,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAlbumDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  releaseYear: number;

  @IsOptional()
  @IsUrl({}, { message: 'coverUrl doit être une URL valide' })
  coverUrl?: string;

  @IsString()
  artistId: string;
}
