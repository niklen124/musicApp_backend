import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  private stripPassword<T extends { passwordHash: string }>(user: T) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...rest } = user;
    return rest;
  }

  async findMe(userId: number) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }
    return this.stripPassword(user);
  }

  async updateMe(userId: number, updateUserDto: UpdateUserDto) {
    await this.findMe(userId); // vérifie l'existence
    const user = await this.databaseService.user.update({
      where: { id: userId },
      data: updateUserDto,
    });
    return this.stripPassword(user);
  }

  async getPreferences(userId: number) {
    const preference = await this.databaseService.userPreference.findUnique({
      where: { userId },
    });
    // Si l'utilisateur n'a jamais défini de préférences, on renvoie les valeurs par défaut
    return (
      preference ?? {
        userId,
        theme: 'dark',
        defaultVolume: 80,
      }
    );
  }

  async updatePreferences(
    userId: number,
    updatePreferenceDto: UpdatePreferenceDto,
  ) {
    // upsert : crée la préférence si elle n'existe pas encore, sinon la met à jour
    return this.databaseService.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        theme: updatePreferenceDto.theme ?? 'dark',
        defaultVolume: updatePreferenceDto.defaultVolume ?? 80,
      },
      update: updatePreferenceDto,
    });
  }

  async findAll() {
    const users = await this.databaseService.user.findMany();
    return users.map((user) => this.stripPassword(user));
  }

  async updateRole(id: number, updateRoleDto: UpdateRoleDto) {
    const user = await this.databaseService.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Utilisateur ${id} introuvable`);
    }
    const updated = await this.databaseService.user.update({
      where: { id },
      data: { role: updateRoleDto.role },
    });
    return this.stripPassword(updated);
  }
}
