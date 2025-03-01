import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { JwtService } from './services/jwt.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { GoogleStrategy } from './strategies/google.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleAuthGuard } from './guards/google-auth.guard';

@Module({
  imports: [
    forwardRef(() => SupabaseModule),
    PassportModule.register({
      session: false,
      _defaultStrategy: 'google',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        _secret: configService.get<string>('auth.supabase.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<number>('auth.session.maxAge'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    JwtService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    GoogleStrategy,
    GoogleAuthGuard,
  ],
  exports: [
    JwtService,
    AuthGuard,
    RolesGuard,
    PermissionsGuard,
    GoogleAuthGuard,
    GoogleStrategy,
  ],
})
export class AuthModule {}
