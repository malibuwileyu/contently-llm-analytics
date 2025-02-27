import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '../../guards/auth.guard';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';
import { ROLES_KEY } from '../../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../../decorators/permissions.decorator';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  const createMockExecutionContext = (token?: string) => {
    const mockRequest = {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
      user: null,
    };

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
    return mockContext as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for valid token and no role/permission requirements', async () => {
      // Setup
      const context = createMockExecutionContext('valid-token');
      const decodedToken = { sub: 'user-123', roles: ['user'], permissions: ['read'] };
      
      // Mock reflector to return no requirements
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      
      // Mock JWT verification
      (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

      // Execute
      const result = await guard.canActivate(context);

      // Verify
      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      // Setup
      const context = createMockExecutionContext();
      
      // Mock reflector to return no requirements
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

      // Execute & Verify
      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token format', async () => {
      // Setup - use 'invalid-format' without 'Bearer ' prefix
      const mockRequest = {
        headers: {
          authorization: 'invalid-format',
        },
        user: null,
      };

      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      };
      
      const context = mockContext as unknown as ExecutionContext;
      
      // Mock reflector to return no requirements
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      
      // Execute & Verify
      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      const context = createMockExecutionContext('valid-token');
      
      // Mock reflector to return no requirements
      (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
      
      // Mock JWT verification to fail
      (jwtService.verify as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context))
        .rejects
        .toThrow(UnauthorizedException);
    });

    describe('Role-based access', () => {
      it('should allow access when user has required role', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { sub: 'user-123', roles: ['admin'], permissions: [] };
        
        // Mock reflector to return role requirement
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return ['admin'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute
        const result = await guard.canActivate(context);

        // Verify
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException when required role is not present', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { sub: 'user-123', roles: ['user'], permissions: [] };
        
        // Mock reflector to return role requirement
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return ['admin'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute & Verify
        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });
    });

    describe('Permission-based access', () => {
      it('should allow access when user has required permission', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { 
          sub: 'user-123', 
          roles: ['user'], 
          permissions: ['update:content'] 
        };
        
        // Mock reflector to return permission requirement
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === PERMISSIONS_KEY) return ['update:content'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute
        const result = await guard.canActivate(context);

        // Verify
        expect(result).toBe(true);
      });

      it('should throw ForbiddenException when required permission is not present', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { 
          sub: 'user-123', 
          roles: ['user'], 
          permissions: ['read:content'] 
        };
        
        // Mock reflector to return permission requirement
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === PERMISSIONS_KEY) return ['update:content'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute & Verify
        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });
    });

    describe('Combined role and permission checks', () => {
      it('should allow access when both role and permission requirements are met', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { 
          sub: 'user-123', 
          roles: ['admin'], 
          permissions: ['manage:system'] 
        };
        
        // Mock reflector to return both role and permission requirements
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return ['admin'];
            if (key === PERMISSIONS_KEY) return ['manage:system'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute
        const result = await guard.canActivate(context);

        // Verify
        expect(result).toBe(true);
      });

      it('should fail when role requirement is met but permission is missing', async () => {
        // Setup
        const context = createMockExecutionContext('valid-token');
        const decodedToken = { 
          sub: 'user-123', 
          roles: ['admin'], 
          permissions: ['read:content'] 
        };
        
        // Mock reflector to return both role and permission requirements
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === ROLES_KEY) return ['admin'];
            if (key === PERMISSIONS_KEY) return ['manage:system'];
            return undefined;
          });
        
        // Mock JWT verification
        (jwtService.verify as jest.Mock).mockResolvedValue(decodedToken);

        // Execute & Verify
        await expect(guard.canActivate(context))
          .rejects
          .toThrow(ForbiddenException);
      });
    });

    describe('Public route handling', () => {
      it('should allow access to public routes', async () => {
        // Setup
        const context = createMockExecutionContext();
        
        // Mock reflector to mark route as public
        (reflector.getAllAndOverride as jest.Mock)
          .mockImplementation((key) => {
            if (key === IS_PUBLIC_KEY) return true;
            return undefined;
          });

        // Execute
        const result = await guard.canActivate(context);

        // Verify
        expect(result).toBe(true);
        expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
      });
    });
  });
}); 