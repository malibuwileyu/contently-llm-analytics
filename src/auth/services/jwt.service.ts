import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from '../types/auth.types';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtService {
  constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email || '',
      roles: user.roles || [],
      permissions: user.permissions || [],
      iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('auth.supabase.jwtSecret'),
      expiresIn: this.configService.get<number>('auth.session.maxAge'),
    });
  }

  async verifyToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verify(token, {
        secret: this.configService.get<string>('auth.supabase.jwtSecret'),
      });
    } catch (_error) {
      throw new Error('Invalid token');
    }
  }

  async decodeToken(token: string): Promise<JwtPayload> {
    return this.jwtService.decode(token) as JwtPayload;
  }
}
