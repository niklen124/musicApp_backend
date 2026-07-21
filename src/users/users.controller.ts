import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

interface AuthenticatedRequest extends Request {
  user: { id: number; role: string };
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // --- Routes personnelles : n'importe quel utilisateur connecté ---

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return this.usersService.findMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/preferences')
  getMyPreferences(@Req() req: AuthenticatedRequest) {
    return this.usersService.getPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/preferences')
  updateMyPreferences(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdatePreferenceDto,
  ) {
    return this.usersService.updatePreferences(req.user.id, dto);
  }

  // --- Routes admin ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/role')
  updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateRole(id, dto);
  }
}
