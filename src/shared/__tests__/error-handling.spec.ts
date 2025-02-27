import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BaseError } from '../errors/base.error';
import { ErrorCategory } from '../errors/error-category.enum';
import { ValidationError, NotFoundError } from '../errors/application.errors';
import { LoggerService } from '../services/logger.service';
import { SentryService } from '../services/sentry.service';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import * as request from 'supertest';

// Create a test controller that throws different types of errors
@Controller('test-errors')
class TestErrorsController {
  constructor(private readonly logger: LoggerService) {}

  @Get('validation')
  throwValidationError() {
    throw new ValidationError('Invalid input data');
  }

  @Get('not-found')
  throwNotFoundError() {
    throw new NotFoundError('Resource not found');
  }

  @Get('base-error')
  throwBaseError() {
    throw new BaseError(
      'Custom error',
      'CUSTOM_ERROR',
      HttpStatus.BAD_REQUEST,
      ErrorCategory.VALIDATION,
    );
  }

  @Get('standard-error')
  throwStandardError() {
    throw new Error('Standard error');
  }

  @Get('http-exception')
  throwHttpException() {
    throw new Error('HTTP exception');
  }
}

// Create mock services
const createMockLoggerService = () => ({
  setContext: jest.fn().mockReturnThis(),
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
});

const createMockSentryService = () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
});

describe('Error Handling System', () => {
  let app: INestApplication;
  let loggerService: any;
  let sentryService: any;

  beforeAll(async () => {
    // Create mock services
    const mockLoggerService = createMockLoggerService();
    const mockSentryService = createMockSentryService();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
      controllers: [TestErrorsController],
      providers: [
        {
          provide: APP_FILTER,
          useClass: GlobalExceptionFilter,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
        {
          provide: SentryService,
          useValue: mockSentryService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    loggerService = moduleFixture.get<LoggerService>(LoggerService);
    sentryService = moduleFixture.get<SentryService>(SentryService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Responses', () => {
    it('should return a standardized error response for ValidationError', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
      });
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });

    it('should return a standardized error response for NotFoundError', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/not-found')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toMatchObject({
        status: 'error',
        code: 'NOT_FOUND',
        message: 'Resource not found',
      });
    });

    it('should return a standardized error response for BaseError', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/base-error')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toMatchObject({
        status: 'error',
        code: 'CUSTOM_ERROR',
        message: 'Custom error',
      });
    });

    it('should return a standardized error response for standard Error', async () => {
      const response = await request(app.getHttpServer())
        .get('/test-errors/standard-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(response.body).toMatchObject({
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Standard error',
      });
    });
  });

  describe('Error Logging', () => {
    it('should log ValidationError as a warning', async () => {
      await request(app.getHttpServer())
        .get('/test-errors/validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(loggerService.warn).toHaveBeenCalled();
    });

    it('should log standard Error as an error', async () => {
      await request(app.getHttpServer())
        .get('/test-errors/standard-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(loggerService.error).toHaveBeenCalled();
    });
  });

  describe('Sentry Integration', () => {
    it('should capture exceptions in Sentry', async () => {
      await request(app.getHttpServer())
        .get('/test-errors/standard-error')
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);

      expect(sentryService.captureException).toHaveBeenCalled();
    });

    it('should not capture 4xx errors in Sentry (except 401/403)', async () => {
      await request(app.getHttpServer())
        .get('/test-errors/validation')
        .expect(HttpStatus.BAD_REQUEST);

      expect(sentryService.captureException).not.toHaveBeenCalled();
    });
  });
});
