import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { AuthService } from '../../auth.service';
import { GoogleStrategy } from '../../strategies/google.strategy';
import { CacheModule } from '@nestjs/cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AuthGuard } from '../../guards/auth.guard';
import { Reflector } from '@nestjs/core';

describe('Google Auth Integration', () => {
  let module: TestingModule;
  let authService: AuthService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Use in-memory cache for tests
        CacheModule.register({
          isGlobal: true,
        }),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              supabase: {
                jwtSecret: 'test-secret'
              },
              session: {
                maxAge: 3600
              },
              google: {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                callbackUrl: 'http://localhost:3000/api/auth/google/callback'
              }
            },
            // Add mock Redis configuration
            redis: {
              host: 'localhost',
              port: 6379,
              ttl: 60,
              max: 100,
              isGlobal: true
            }
          })]
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        AuthService,
        {
          provide: GoogleStrategy,
          useValue: {
            validate: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
            decode: jest.fn(),
          },
        },
        {
          provide: AuthGuard,
          useFactory: (reflector, jwtService) => new AuthGuard(reflector, jwtService),
          inject: [Reflector, JwtService]
        },
      ],
    })
    .overrideProvider(CACHE_MANAGER)
    .useValue({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      wrap: jest.fn(),
    })
    .compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
