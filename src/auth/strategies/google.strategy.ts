import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { User } from '../types/auth.types';
import { Role } from '../enums/role.enum';
import { Permission } from '../enums/permission.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(private readonly configService: ConfigService) {
    // Check if Google OAuth is configured
    const clientID = configService.get<string>('auth.google.clientId');
    const clientSecret = configService.get<string>('auth.google.clientSecret');
    const callbackURL = configService.get<string>('auth.google.callbackUrl');

    // Configure the strategy with either real or dummy credentials
    super({
      clientID: clientID || 'dummy-client-id',
      clientSecret: clientSecret || 'dummy-client-secret',
      callbackURL: callbackURL || 'http://localhost/auth/google/callback',
      scope: ['email', 'profile'],
    });

    // Log warning if Google OAuth is not properly configured
    if (!clientID || !clientSecret || !callbackURL) {
      this.logger.warn(
        'Google OAuth is not properly configured. The strategy will be disabled.',
      );
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    try {
      if (!profile || !profile.id) {
        throw new Error('Invalid profile data received from Google');
      }

      const user: User = {
        id: profile.id,
        email: profile.emails?.[0]?.value,
        roles: [Role.USER], // Default role for Google SSO users
        permissions: [Permission.READ_CONTENT], // Default permission
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        googleProfile: {
          displayName: profile.displayName,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          picture: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        },
      };

      done(null, user);
    } catch (error) {
      done(error, undefined);
    }
  }
}
