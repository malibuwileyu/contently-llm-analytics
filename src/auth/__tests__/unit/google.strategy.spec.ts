import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from '../../strategies/google.strategy';
import { Profile } from 'passport-google-oauth20';
import { Role } from '../../enums/role.enum';
import { Permission } from '../../enums/permission.enum';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'auth.google.clientId':
                  return 'mock-client-id';
                case 'auth.google.clientSecret':
                  return 'mock-client-secret';
                case 'auth.google.callbackUrl':
                  return 'mock-callback-url';
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('constructor', () => {
    it('should set up strategy with correct config', () => {
      expect(configService.get).toHaveBeenCalledWith('auth.google.clientId');
      expect(configService.get).toHaveBeenCalledWith('auth.google.clientSecret');
      expect(configService.get).toHaveBeenCalledWith('auth.google.callbackUrl');
    });
  });

  describe('validate', () => {
    const mockProfile: Partial<Profile> = {
      id: 'test-id',
      displayName: 'Test User',
      emails: [{ value: 'test@example.com', verified: true }],
      name: {
        givenName: 'Test',
        familyName: 'User',
      },
      photos: [{ value: 'http://example.com/photo.jpg' }],
    };

    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';

    it('should create user from Google profile', async () => {
      const done = jest.fn();

      await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        mockProfile as Profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        id: mockProfile.id,
        email: mockProfile.emails?.[0].value,
        roles: [Role.USER],
        permissions: [Permission.READ_CONTENT],
        googleProfile: {
          displayName: mockProfile.displayName,
          firstName: mockProfile.name?.givenName,
          lastName: mockProfile.name?.familyName,
          picture: mockProfile.photos?.[0].value,
          accessToken: mockAccessToken,
          refreshToken: mockRefreshToken,
        },
      }));
    });

    it('should handle missing profile information', async () => {
      const done = jest.fn();
      const minimalProfile: Partial<Profile> = {
        id: 'test-id',
      };

      await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        minimalProfile as Profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, expect.objectContaining({
        id: minimalProfile.id,
        roles: [Role.USER],
        permissions: [Permission.READ_CONTENT],
      }));
    });

    it('should handle validation errors', async () => {
      const done = jest.fn();
      const invalidProfile = null;

      await strategy.validate(
        mockAccessToken,
        mockRefreshToken,
        invalidProfile as unknown as Profile,
        done,
      );

      expect(done).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid profile'),
        }),
        undefined,
      );
    });
  });
}); 