import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '../../services/jwt.service';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { User } from '../../types/auth.types';

interface JwtPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
}

describe('JwtService', () => {
  let service: JwtService;
  let nestJwtService: NestJwtService;
  let configService: ConfigService;

  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    roles: ['user'],
    permissions: ['read:content']
  };

  const mockJwtSecret = 'test-secret';
  const mockSessionMaxAge = 3600;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: NestJwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
            decode: jest.fn()
          }
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'auth.supabase.jwtSecret':
                  return mockJwtSecret;
                case 'auth.session.maxAge':
                  return mockSessionMaxAge;
                default:
                  return null;
              }
            })
          }
        }
      ]
    }).compile();

    service = module.get<JwtService>(JwtService);
    nestJwtService = module.get<NestJwtService>(NestJwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  describe('generateToken', () => {
    it('should generate a token with correct payload', async () => {
      const mockToken = 'mock-token';
      const signSpy = jest.spyOn(nestJwtService, 'sign').mockReturnValue(mockToken);

      const token = await service.generateToken(mockUser);

      expect(token).toBe(mockToken);
      expect(signSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          roles: mockUser.roles,
          permissions: mockUser.permissions,
          iat: expect.any(Number)
        }),
        {
          secret: mockJwtSecret,
          expiresIn: mockSessionMaxAge
        }
      );
    });

    it('should handle missing optional user fields', async () => {
      const mockToken = 'mock-token';
      const partialUser: User = { id: 'test-id' };
      jest.spyOn(nestJwtService, 'sign').mockReturnValue(mockToken);

      const token = await service.generateToken(partialUser);

      expect(token).toBe(mockToken);
    });

    it('should include expiration time in token', async () => {
      const mockToken = 'mock-token';
      const signSpy = jest.spyOn(nestJwtService, 'sign').mockReturnValue(mockToken);

      await service.generateToken(mockUser);

      expect(signSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          expiresIn: mockSessionMaxAge
        })
      );
    });
  });

  describe('verifyToken', () => {
    it('should verify and return the token payload', async () => {
      const mockPayload: JwtPayload = {
        sub: 'user123',
        username: 'testuser',
        roles: ['USER'],
        permissions: ['READ']
      };

      const verifySpy = jest.spyOn(nestJwtService, 'verify').mockImplementation(() => mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(verifySpy).toHaveBeenCalledWith('valid-token', {
        secret: mockJwtSecret
      });
    });

    it('should throw error for invalid token', async () => {
      const mockToken = 'invalid-token';
      jest.spyOn(nestJwtService, 'verify').mockRejectedValue(new Error('Invalid token') as never);

      await expect(service.verifyToken(mockToken))
        .rejects
        .toThrow('Invalid token');
    });

    it('should throw error for expired token', async () => {
      const mockToken = 'expired-token';
      jest.spyOn(nestJwtService, 'verify').mockRejectedValue(new Error('jwt expired') as never);

      await expect(service.verifyToken(mockToken))
        .rejects
        .toThrow('Invalid token');
    });

    it('should throw error for malformed token', async () => {
      const mockToken = 'malformed-token';
      jest.spyOn(nestJwtService, 'verify').mockRejectedValue(new Error('jwt malformed') as never);

      await expect(service.verifyToken(mockToken))
        .rejects
        .toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', async () => {
      const mockToken = 'token-to-decode';
      const mockPayload = {
        sub: mockUser.id,
        email: mockUser.email
      };

      jest.spyOn(nestJwtService, 'decode').mockReturnValue(mockPayload);

      const result = await service.decodeToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(nestJwtService.decode).toHaveBeenCalledWith(mockToken);
    });

    it('should handle null decode result', async () => {
      const mockToken = 'invalid-token';
      jest.spyOn(nestJwtService, 'decode').mockReturnValue(null);

      const result = await service.decodeToken(mockToken);

      expect(result).toBeNull();
    });

    it('should not throw on invalid token format', async () => {
      const mockToken = 'invalid-format';
      jest.spyOn(nestJwtService, 'decode').mockReturnValue(null);

      await expect(service.decodeToken(mockToken)).resolves.not.toThrow();
    });
  });
}); 