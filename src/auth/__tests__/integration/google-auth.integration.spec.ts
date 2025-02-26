import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AuthModule } from '../../auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../../supabase/supabase.service';
import { Role } from '../../enums/role.enum';
import { Permission } from '../../enums/permission.enum';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '../../strategies/google.strategy';
import { User } from '../../types/auth.types';
import { Profile, VerifyCallback } from 'passport-google-oauth20';
import { Strategy } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import * as passport from 'passport';

// Create a test-specific GoogleStrategy
@Injectable()
class TestGoogleStrategy extends GoogleStrategy {
  constructor(configService: ConfigService) {
    super(configService);
  }

  authenticate(req: any, options?: any): void {
    if (req.query.error) {
      this.error(new Error(req.query.error));
      return;
    }

    if (req.query.code) {
      const user: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        roles: [Role.USER],
        permissions: [Permission.READ_CONTENT],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        googleProfile: {
          displayName: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          picture: 'http://example.com/photo.jpg',
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
        },
      };
      this.success(user);
      return;
    }

    this.redirect('https://accounts.google.com/o/oauth2/v2/auth');
  }
}

describe('Google OAuth Integration', () => {
  let app: INestApplication;
  let supabaseService: SupabaseService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              google: {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                callbackUrl: 'http://localhost:3000/api/auth/google/callback',
              },
              supabase: {
                jwtSecret: 'test-jwt-secret',
              },
              session: {
                maxAge: 3600,
              },
            },
            app: {
              clientUrl: 'http://localhost:3000',
            },
          })],
        }),
        AuthModule,
      ],
    })
      .overrideProvider(SupabaseService)
      .useValue({
        signUp: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              roles: [Role.USER],
              permissions: [Permission.READ_CONTENT],
            },
            session: {
              access_token: 'test-access-token',
              refresh_token: 'test-refresh-token',
              expires_in: 3600,
              token_type: 'bearer',
            },
          },
          error: null,
        }),
      })
      .overrideProvider(GoogleStrategy)
      .useClass(TestGoogleStrategy)
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Set up global prefix
    app.setGlobalPrefix('api');
    
    // Initialize Passport middleware
    app.use(passport.initialize());
    
    await app.init();

    supabaseService = moduleFixture.get<SupabaseService>(SupabaseService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Google OAuth Flow', () => {
    it('should redirect to Google login', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/google')
        .expect(302);

      expect(response.header.location).toContain('accounts.google.com/o/oauth2/v2/auth');
    });

    it('should handle Google callback and create user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback')
        .query({
          code: 'test-auth-code',
          state: 'test-state',
        })
        .expect(302);

      // Verify redirect to frontend with token
      const clientUrl = configService.get<string>('app.clientUrl');
      expect(response.header.location).toBe(
        `${clientUrl}/auth/callback?token=test-access-token`,
      );

      // Verify Supabase user creation
      expect(supabaseService.signUp).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String),
      );
    });

    it('should handle existing user gracefully', async () => {
      // Mock Supabase to return "user exists" error
      jest.spyOn(supabaseService, 'signUp').mockResolvedValueOnce({
        data: {
          user: {
            id: 'existing-user-id',
            email: 'test@example.com',
            roles: [Role.USER],
            permissions: [Permission.READ_CONTENT],
          },
          session: {
            access_token: 'existing-user-token',
            refresh_token: 'existing-refresh-token',
            expires_in: 3600,
            token_type: 'bearer',
          },
        },
        error: { message: 'User already registered' },
      });

      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback')
        .query({
          code: 'test-auth-code',
          state: 'test-state',
        })
        .expect(302);

      const clientUrl = configService.get<string>('app.clientUrl');
      expect(response.header.location).toBe(
        `${clientUrl}/auth/callback?token=existing-user-token`,
      );
    });

    it('should handle Google authentication errors', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/google/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access',
        })
        .expect(302);

      const clientUrl = configService.get<string>('app.clientUrl');
      expect(response.header.location).toBe(
        `${clientUrl}/auth/callback?error=access_denied`,
      );
    });
  });
}); 