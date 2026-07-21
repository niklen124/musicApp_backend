import { IsIn } from 'class-validator';

export class RepeatModeDto {
  @IsIn(['none', 'one', 'all'], {
    message: 'repeatMode doit être "none", "one" ou "all"',
  })
  repeatMode: 'none' | 'one' | 'all';
}
