import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateArtistDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  bio: string;
}
