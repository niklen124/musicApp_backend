import { IsIn } from 'class-validator';

export class UpdateRoleDto {
  @IsIn(['USER', 'ARTIST', 'ADMIN'], {
    message: 'role doit être USER, ARTIST ou ADMIN',
  })
  role: 'USER' | 'ARTIST' | 'ADMIN';
}
