import { PartialType, OmitType } from '@nestjs/mapped-types';
import { RegisterAuthDto } from './register-auth.dto';

// On exclut passwordHash : la mise à jour du mot de passe doit passer
// par un endpoint dédié (ex: /auth/change-password) qui vérifie l'ancien
// mot de passe avant d'en accepter un nouveau, pas par un PATCH générique.
export class UpdateAuthDto extends PartialType(
  OmitType(RegisterAuthDto, ['passwordHash'] as const),
) {}
