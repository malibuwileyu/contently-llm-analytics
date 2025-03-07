import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from '../config/auth.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '@/supabase/supabase.service';

const { UserEntity } = require('./entities/user.entity');
type User = typeof UserEntity;

@Injectable()
export class AuthService {
  private readonly authConfig: AuthConfig;

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.authConfig = this.configService.get<AuthConfig>('auth');
  }

  async createUser(params: {
    email: string;
    password?: string;
    metadata?: {
      firstName?: string;
      lastName?: string;
      company?: string;
      title?: string;
    };
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: params.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const user = this.userRepository.create({
      email: params.email,
      password: params.password ? await bcrypt.hash(params.password, 10) : null,
      rawUserMetaData: params.metadata || {},
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.password) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }

  async updateUserMetadata(
    userId: string,
    metadata: Record<string, any>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    user.rawUserMetaData = {
      ...user.rawUserMetaData,
      ...metadata,
    };

    return this.userRepository.save(user);
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
