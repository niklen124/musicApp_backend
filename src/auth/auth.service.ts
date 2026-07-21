import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { DatabaseService } from 'src/database/database.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

interface JwtPayload {
  id: number;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerAuthDto: RegisterAuthDto) {
    // Find the user email
    const EmailInUse = await this.databaseService.user.findUnique({
      where: { email: registerAuthDto.email },
    });
    if (EmailInUse) {
      throw new BadRequestException('Email already in use');
    }

    // Hashed the password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(registerAuthDto.passwordHash, 10);
    const user = await this.databaseService.user.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { ...registerAuthDto, passwordHash: hashedPassword },
    });

    // On ne renvoie jamais le passwordHash au client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userInfo } = user;
    return userInfo;
  }

  async login(loginAuthDto: LoginAuthDto) {
    const { email, passwordHash } = loginAuthDto;
    // Find the user email
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('wrong email or password');
    }

    // Conpare password
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const isValidPassword = await bcrypt.compare(
      passwordHash,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('wrong email or password');
    }

    // Generate + store tokens (le refresh token doit être en DB pour pouvoir être rafraîchi/révoqué)
    const tokens = await this.generateAndStoreTokens(user.id, user.role);

    // On ne renvoie jamais le passwordHash au client
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...userInfo } = user;

    return {
      user: userInfo,
      ...tokens,
    };
  }

  // Generate user token
  generateUserTokens(userId: number, role: string) {
    const payload: JwtPayload = { id: userId, role };
    // accessToken : signé avec JWT_SECRET (secret par défaut du JwtModule global)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    // refreshToken : signé avec un secret DIFFÉRENT (jwt.refreshSecret)
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.refreshSecret'),
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // Store refresh token
  async storeRefreshToken(userId: number, refreshToken: string) {
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.databaseService.refreshToken.create({
      data: {
        hashedToken,
        userId,
        expiresAt,
      },
    });
  }

  // Generate and store tokens
  async generateAndStoreTokens(userId: number, role: string) {
    const tokens = this.generateUserTokens(userId, role);
    await this.storeRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  // Refresh tokens
  // Le userId n'est JAMAIS fourni par le client : il est extrait et vérifié
  // depuis le refresh token JWT lui-même, pour éviter qu'un client puisse
  // usurper l'identité d'un autre utilisateur.
  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (err) {
      console.error('[refreshTokens] JWT verify failed:', err);
      throw new UnauthorizedException('Access denied');
    }

    const userId = payload.id;

    const storedTokens = await this.databaseService.refreshToken.findMany({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (storedTokens.length === 0) {
      console.error(
        `[refreshTokens] Aucun token actif en DB pour userId=${userId}`,
      );
      throw new UnauthorizedException('Access denied');
    }

    let matchedToken: (typeof storedTokens)[number] | null = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.hashedToken);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      console.error(
        `[refreshTokens] Aucun hash correspondant parmi ${storedTokens.length} token(s) stocké(s)`,
      );
      throw new UnauthorizedException('Access denied');
    }

    // Rotation : on révoque l'ancien token
    await this.databaseService.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revoked: true },
    });

    // On relit le rôle depuis la DB (au cas où il aurait changé depuis l'émission du token)
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('Access denied');
    }

    // Et on génère + stocke une nouvelle paire
    return this.generateAndStoreTokens(userId, user.role);
  }

  // Logout : révoque tous les refresh tokens actifs de l'utilisateur
  async logout(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Access denied');
    }

    await this.databaseService.refreshToken.updateMany({
      where: { userId: payload.id, revoked: false },
      data: { revoked: true },
    });

    return { message: 'logout successful' };
  }

  // Create the user
  async create(createAuthDto: Prisma.UserCreateInput) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.databaseService.user.create({ data: createAuthDto });
  }

  findAll() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.databaseService.user.findMany();
  }

  async findOne(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.databaseService.user.findUnique({ where: { id } });
  }

  async update(id: number, updateAuthDto: UpdateAuthDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.databaseService.user.update({
      where: { id },
      data: updateAuthDto,
    });
  }

  async remove(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.databaseService.user.delete({ where: { id } });
  }
}
