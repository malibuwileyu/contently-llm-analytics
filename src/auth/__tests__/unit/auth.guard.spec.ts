import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../../guards/auth.guard';
import { JwtService } from '../../services/jwt.service';
import { Role } from '../../enums/role.enum';
import { Permission } from '../../enums/permission.enum';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

jest.mock('@nestjs/graphql');

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  const mockJwtPayload = {
    sub: 'test-user-id',
    email: 'test@example.com',
    roles: [Role.USER],
    permissions: [Permission.READ_CONTENT]
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        },
        {
          provide: JwtService,
          useValue: {
            verifyToken: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
  });

  const createMockExecutionContext = (token?: string, type: 'http' | 'graphql' = 'http'): ExecutionContext => {
    const mockContext = {
      getType: () => type,
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => null,
      switchToWs: () => null,
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: token ? `Bearer ${token}` : undefined
          }
        })
      }),
      getClass: () => Test,
      getHandler: () => jest.fn()
    };

    if (type === 'graphql') {
      const mockGqlContext = {
        getContext: jest.fn().mockReturnValue({
          req: {
            headers: {
              authorization: token ? `Bearer ${token}` : undefined
            }
          }
        })
      };
      (GqlExecutionContext.create as jest.Mock).mockReturnValue(mockGqlContext);
    }

    return mockContext as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should throw UnauthorizedException when no token is provided', async () => {
      const context = createMockExecutionContext();
      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      const context = createMockExecutionContext('invalid-format');
      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const context = createMockExecutionContext('valid-token');
      jest.spyOn(jwtService, 'verifyToken').mockRejectedValue(new Error('Invalid token') as never);
      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should pass when no roles or permissions are required', async () => {
      const context = createMockExecutionContext('valid-token');
      jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    describe('Role-based access', () => {
      it('should allow access with correct role', async () => {
        const context = createMockExecutionContext('valid-token');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.USER];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException when required role is not present', async () => {
        const context = createMockExecutionContext('valid-token');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.ADMIN];
            return null;
          });

        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });

      it('should allow access with any matching role from multiple required roles', async () => {
        const context = createMockExecutionContext('valid-token');
        const userWithMultipleRoles = {
          ...mockJwtPayload,
          roles: [Role.USER, Role.EDITOR]
        };
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(userWithMultipleRoles);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.ADMIN, Role.EDITOR];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe('Permission-based access', () => {
      it('should allow access with correct permission', async () => {
        const context = createMockExecutionContext('valid-token');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === PERMISSIONS_KEY) return [Permission.READ_CONTENT];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException when required permission is not present', async () => {
        const context = createMockExecutionContext('valid-token');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === PERMISSIONS_KEY) return [Permission.MANAGE_SYSTEM];
            return null;
          });

        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });

      it('should require all permissions when multiple are specified', async () => {
        const context = createMockExecutionContext('valid-token');
        const userWithMultiplePermissions = {
          ...mockJwtPayload,
          permissions: [Permission.READ_CONTENT, Permission.CREATE_CONTENT]
        };
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(userWithMultiplePermissions);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === PERMISSIONS_KEY) return [Permission.READ_CONTENT, Permission.CREATE_CONTENT];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });
    });

    describe('Combined role and permission checks', () => {
      it('should pass when both role and permission requirements are met', async () => {
        const context = createMockExecutionContext('valid-token');
        const userWithBoth = {
          ...mockJwtPayload,
          roles: [Role.ADMIN],
          permissions: [Permission.MANAGE_SYSTEM]
        };
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(userWithBoth);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.ADMIN];
            if (key === PERMISSIONS_KEY) return [Permission.MANAGE_SYSTEM];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should fail when role requirement is met but permission is missing', async () => {
        const context = createMockExecutionContext('valid-token');
        const userWithRoleOnly = {
          ...mockJwtPayload,
          roles: [Role.ADMIN],
          permissions: []
        };
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(userWithRoleOnly);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.ADMIN];
            if (key === PERMISSIONS_KEY) return [Permission.MANAGE_SYSTEM];
            return null;
          });

        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });
    });

    describe('GraphQL context handling', () => {
      it('should handle GraphQL context correctly', async () => {
        const context = createMockExecutionContext('valid-token', 'graphql');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should handle GraphQL context with roles', async () => {
        const context = createMockExecutionContext('valid-token', 'graphql');
        jest.spyOn(jwtService, 'verifyToken').mockResolvedValue(mockJwtPayload);
        jest.spyOn(reflector, 'getAllAndOverride')
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return [Role.USER];
            return null;
          });

        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });
    });
  });
}); 