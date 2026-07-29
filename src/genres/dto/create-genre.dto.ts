import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateGenreDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;
}
