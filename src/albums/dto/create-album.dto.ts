import {
  IsString,
  IsInt,
  IsOptional,
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
  @IsString()
  coverUrl?: string;

  @IsString()
  artistId: string;
}
