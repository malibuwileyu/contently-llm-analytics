# Security Guidelines

## Core Security Principles

1. **Defense in Depth**
   - Multiple layers of security controls
   - Secure by default configuration
   - Principle of least privilege
   - Zero trust architecture

2. **Data Protection**
   - Encryption at rest and in transit
   - Secure key management
   - Data classification
   - Access control

## Authentication & Authorization

### 1. JWT Implementation
```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: SecurityConfig
  ) {}

  async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      roles: user.roles,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000)
    };

    return this.jwtService.sign(payload, {
      secret: this.config.jwtSecret,
      expiresIn: '1h',
      algorithm: 'RS256'
    });
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verify(token, {
        secret: this.config.jwtPublicKey
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### 2. Role-Based Access Control (RBAC)
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler()
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    const payload = await this.authService.validateToken(token);

    return requiredRoles.some(role => payload.roles.includes(role));
  }
}
```

## Input Validation

### 1. Request Validation
```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
  password: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  roles: string[];
}
```

### 2. Sanitization
```typescript
@Injectable()
export class XssFilter implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }
    next();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object') {
      return this.sanitizeValue(obj);
    }

    return Object.keys(obj).reduce((acc, key) => {
      acc[key] = this.sanitizeValue(obj[key]);
      return acc;
    }, {});
  }

  private sanitizeValue(value: any): any {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
      });
    }
    return value;
  }
}
```

## Data Encryption

### 1. Data at Rest
```typescript
@Injectable()
export class EncryptionService {
  constructor(
    @Inject(ENCRYPTION_CONFIG) private config: EncryptionConfig
  ) {}

  async encrypt(data: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const key = await this.deriveKey(this.config.secret);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);

    const tag = cipher.getAuthTag();
    
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  async decrypt(encryptedData: string): Promise<string> {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.slice(0, 16);
    const tag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);
    
    const key = await this.deriveKey(this.config.secret);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8');
  }
}
```

### 2. Data in Transit
```typescript
// app.module.ts
@Module({
  imports: [
    HttpsModule.forRoot({
      cert: fs.readFileSync('path/to/cert.pem'),
      key: fs.readFileSync('path/to/key.pem'),
      minVersion: 'TLSv1.2'
    })
  ]
})
```

## API Security

### 1. Rate Limiting
```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redis: Redis,
    private readonly config: RateLimitConfig
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, this.config.windowSeconds);
    }

    if (current > this.config.maxRequests) {
      throw new TooManyRequestsException();
    }

    return true;
  }

  private generateKey(request: Request): string {
    const ip = request.ip;
    const endpoint = request.path;
    return `ratelimit:${ip}:${endpoint}`;
  }
}
```

### 2. CORS Configuration
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 3600
  });
}
```

## Error Handling

### 1. Security Error Types
```typescript
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: SecurityErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export enum SecurityErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT = 'INVALID_INPUT',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED'
}
```

### 2. Error Responses
```typescript
@Catch(SecurityError)
export class SecurityErrorFilter implements ExceptionFilter {
  catch(exception: SecurityError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    const status = this.getHttpStatus(exception.code);
    
    response
      .status(status)
      .json({
        statusCode: status,
        error: exception.name,
        code: exception.code,
        message: exception.message,
        timestamp: new Date().toISOString()
      });
  }

  private getHttpStatus(code: SecurityErrorCode): number {
    switch (code) {
      case SecurityErrorCode.INVALID_TOKEN:
        return HttpStatus.UNAUTHORIZED;
      case SecurityErrorCode.INSUFFICIENT_PERMISSIONS:
        return HttpStatus.FORBIDDEN;
      case SecurityErrorCode.RATE_LIMIT_EXCEEDED:
        return HttpStatus.TOO_MANY_REQUESTS;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
```

## Logging & Monitoring

### 1. Security Logging
```typescript
@Injectable()
export class SecurityLogger {
  constructor(
    @Inject(LOGGER_CONFIG) private config: LoggerConfig,
    private readonly logger: Logger
  ) {}

  logSecurityEvent(
    event: SecurityEvent,
    context: Record<string, unknown>
  ): void {
    this.logger.log({
      level: 'security',
      event,
      context,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    });
  }

  logSecurityViolation(
    violation: SecurityViolation,
    context: Record<string, unknown>
  ): void {
    this.logger.error({
      level: 'security',
      violation,
      context,
      timestamp: new Date().toISOString(),
      environment: this.config.environment
    });
  }
}
```

### 2. Audit Trail
```typescript
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>
  ) {}

  async logAction(
    user: User,
    action: AuditAction,
    resource: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await this.auditRepo.save({
      userId: user.id,
      action,
      resource,
      details,
      ipAddress: user.ipAddress,
      userAgent: user.userAgent,
      timestamp: new Date()
    });
  }
}
```

## Security Testing

### 1. Security Test Cases
```typescript
describe('AuthService Security', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, JwtService]
    }).compile();

    service = module.get(AuthService);
    jwtService = module.get(JwtService);
  });

  test('should prevent token tampering', async () => {
    // Generate valid token
    const token = await service.generateToken(mockUser);
    
    // Tamper with token
    const [header, payload, signature] = token.split('.');
    const tamperedToken = `${header}.${payload}modified.${signature}`;
    
    // Verify tampered token is rejected
    await expect(service.validateToken(tamperedToken))
      .rejects
      .toThrow(UnauthorizedException);
  });
});
```

### 2. Penetration Testing
```typescript
describe('API Security', () => {
  test('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    await expect(
      request(app)
        .post('/api/users')
        .send({ username: maliciousInput })
    ).rejects.toThrow(BadRequestException);
  });

  test('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("xss")</script>';
    
    const response = await request(app)
      .post('/api/comments')
      .send({ content: xssPayload });
    
    expect(response.body.content).not.toContain('<script>');
  });
});
``` 