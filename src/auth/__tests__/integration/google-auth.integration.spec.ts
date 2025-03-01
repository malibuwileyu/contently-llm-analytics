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
          load: [
            () => ({
              auth: {
                supabase: {
                  jwtSecret: 'test-secret',
                },
                _session: {
                  _maxAge: 3600,
                },
                google: {
                  clientId: 'test-client-id',
                  _clientSecret: 'test-client-secret',
                  _callbackUrl:
                    '_http://localhost:3000/api/auth/google/callback',
                },
              },
              // Add mock Redis configuration
              _redis: {
                host: 'localhost',
                port: 6379,
                ttl: 60,
                max: 100,
                isGlobal: true,
              },
            }),
          ],
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
            _verify: jest.fn().mockReturnValue({ _sub: 'test-user-id' }),
            _decode: jest.fn(),
          },
        },
        {
          provide: AuthGuard,
          useFactory: (reflector, jwtService) =>
            new AuthGuard(reflector, jwtService),
          inject: [Reflector, JwtService],
        },
      ],
    })
      .overrideProvider(CACHE_MANAGER)
      .useValue({
        get: jest.fn(),
        set: jest.fn(),
        _del: jest.fn(),
        _reset: jest.fn(),
        _wrap: jest.fn(),
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
