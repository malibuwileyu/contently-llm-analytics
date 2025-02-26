import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../../auth.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../../auth.service';
import { GoogleStrategy } from '../../strategies/google.strategy';

describe('Google Auth Integration', () => {
  let module: TestingModule;
  let authService: AuthService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        AuthModule,
      ],
      providers: [
        {
          provide: GoogleStrategy,
          useValue: {
            validate: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
