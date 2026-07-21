import { IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @MinLength(1, { message: 'Le paramètre q ne peut pas être vide' })
  q: string;
}
