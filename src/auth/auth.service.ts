import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateToken(user: User): Promise<string> {
    const payload = {
      _sub: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      _iat: Math.floor(Date.now() / 1000),
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get('auth.supabase.jwtSecret'),
      expiresIn: this.configService.get('auth.session.maxAge'),
    });
  }

  async validateToken(token: string): Promise<Record<string, unknown>> {
    try {
      return await this.jwtService.verify(token, {
        secret: this.configService.get('auth.supabase.jwtSecret'),
      });
    } catch (_error) {
      throw new Error('Invalid token');
    }
  }

  async validateUser(email: string, _password: string): Promise<User | null> {
    // This would typically validate against your user store
    // For now, return null to indicate invalid credentials
    return null;
  }
}
