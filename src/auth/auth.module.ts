import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtService } from './services/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { CacheModule } from './cache/cache.module';
import { CacheController } from './cache/cache.controller';
import { User } from './entities/user.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({
      session: false,
      defaultStrategy: 'google',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('SESSION_MAX_AGE'),
        },
      }),
      inject: [ConfigService],
    }),
    CacheModule,
  ],
  controllers: [AuthController, CacheController],
  providers: [
    JwtService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    GoogleStrategy,
    GoogleAuthGuard,
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [
    JwtService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    GoogleAuthGuard,
    AuthService,
  ],
})
export class AuthModule {}
