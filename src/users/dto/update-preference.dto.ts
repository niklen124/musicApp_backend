import { IsInt, IsOptional, Min, Max, IsIn } from 'class-validator';

export class UpdatePreferenceDto {
  @IsOptional()
  @IsIn(['light', 'dark'], { message: 'theme doit être "light" ou "dark"' })
  theme?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  defaultVolume?: number;
}
