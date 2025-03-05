import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from './services/jwt.service';
import { ConfigService } from '@nestjs/config';
import { AuthConfig } from '../config/auth.config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly authConfig: AuthConfig;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.authConfig = this.configService.get<AuthConfig>('auth');
  }

  async createUser(params: {
    email: string;
    password?: string;
    companyId?: string;
    rawUserMetaData?: {
      firstName?: string;
      lastName?: string;
      picture?: string;
      roles?: string[];
      permissions?: string[];
      department?: string;
      title?: string;
    };
  }): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: params.email },
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    let encryptedPassword: string | undefined;
    if (params.password) {
      encryptedPassword = await bcrypt.hash(params.password, 10);
    }

    const now = new Date();
    const user = this.userRepository.create({
      id: uuidv4(),
      email: params.email,
      encryptedPassword,
      companyId: params.companyId,
      rawUserMetaData: {
        firstName: params.rawUserMetaData?.firstName,
        lastName: params.rawUserMetaData?.lastName,
        picture: params.rawUserMetaData?.picture,
        roles: params.rawUserMetaData?.roles || ['user'],
        permissions: params.rawUserMetaData?.permissions || [],
        department: params.rawUserMetaData?.department,
        title: params.rawUserMetaData?.title,
      },
      lastSignInAt: now,
      createdAt: now,
      updatedAt: now,
    });

    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user || !user.encryptedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.encryptedPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async updateUserMetadata(
    userId: string,
    metadata: Partial<User['rawUserMetaData']>,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.rawUserMetaData = {
      ...user.rawUserMetaData,
      ...metadata,
    };
    user.updatedAt = new Date();

    return this.userRepository.save(user);
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
      permissions: user.permissions,
      metadata: user.rawUserMetaData,
    };

    // Update last sign in
    await this.userRepository.update(user.id, {
      lastSignInAt: new Date(),
    });

    return {
      access_token: await this.jwtService.sign(payload),
      user: payload,
    };
  }

  async validateToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}
