import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterAuthDto {
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(50)
  name: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères',
  })
  @MaxLength(72) // limite technique de bcrypt
  passwordHash: string;
}
