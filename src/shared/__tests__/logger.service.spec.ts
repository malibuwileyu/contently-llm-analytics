import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../services/logger.service';
import * as winston from 'winston';
import { BaseError } from '../errors/base.error';
import { ErrorCode } from '../errors/application.errors';
import { ErrorCategory } from '../errors/error-category.enum';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  const mockTransports = {
    Console: jest.fn(),
    File: jest.fn(),
  };

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };

  return {
    format: mockFormat,
    transports: mockTransports,
    createLogger: jest.fn().mockReturnValue(mockLogger),
  };
});

describe('LoggerService', () => {
  let service: LoggerService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _configService: ConfigService;
  let mockWinstonLogger: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'logger.level':
                  return 'debug';
                case 'logger.directory':
                  return './logs';
                case 'logger.maxFiles':
                  return 5;
                case 'logger.maxSize':
                  return '10m';
              }
            }),
          },
        },
      ],
    }).compile();

    // Use resolve instead of get for scoped providers
    service = await module.resolve<LoggerService>(LoggerService);
    _configService = module.get<ConfigService>(ConfigService);
    mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0]
      .value;

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log levels', () => {
    it('should log at different levels', () => {
      service.log('info message');
      service.error('error message');
      service.warn('warning message');
      service.debug('debug message');
      service.verbose('verbose message');

      expect(mockWinstonLogger.info).toHaveBeenCalled();
      expect(mockWinstonLogger.error).toHaveBeenCalled();
      expect(mockWinstonLogger.warn).toHaveBeenCalled();
      expect(mockWinstonLogger.debug).toHaveBeenCalled();
      expect(mockWinstonLogger.verbose).toHaveBeenCalled();
    });
  });

  describe('context handling', () => {
    it('should set and use context', () => {
      service.setContext('TestContext');
      service.log('test message');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          context: 'TestContext',
        }),
      );
    });

    it('should override context in method call', () => {
      service.setContext('DefaultContext');
      service.log('test message', 'OverrideContext');

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'test message',
        expect.objectContaining({
          context: 'OverrideContext',
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle error objects', () => {
      const error = new Error('Test error');
      service.error(error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });

    it('should handle error with context', () => {
      const error = new Error('Test error');
      service.error(error, undefined, 'ErrorContext');

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          context: 'ErrorContext',
          stack: expect.any(String),
        }),
      );
    });
  });

  describe('structured logging', () => {
    it('should handle structured log messages', () => {
      const structuredMessage = {
        message: 'User logged in',
        meta: {
          userId: '123',
          action: 'login',
          status: 'success',
        },
      };

      service.log(structuredMessage);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'User logged in',
        expect.objectContaining({
          userId: '123',
          action: 'login',
          status: 'success',
        }),
      );
    });

    it('should handle metadata in log messages', () => {
      const meta = { userId: '123', ip: '127.0.0.1' };
      service.log('User logged in', undefined, meta);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'User logged in',
        expect.objectContaining({
          userId: '123',
          ip: '127.0.0.1',
        }),
      );
    });
  });

  describe('setContext', () => {
    it('should set the context and return this', () => {
      const result = service.setContext('TestContext');
      expect(result).toBe(service);
    });
  });

  describe('log methods', () => {
    it('should log a simple message', () => {
      service.log('Simple message');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Simple message',
        expect.objectContaining({
          context: undefined,
        }),
      );
    });

    it('should log with context', () => {
      service.setContext('TestContext');
      service.log('Message with context');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Message with context',
        expect.objectContaining({
          context: 'TestContext',
        }),
      );
    });

    it('should log with override context', () => {
      service.setContext('DefaultContext');
      service.log('Message with override', 'OverrideContext');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Message with override',
        expect.objectContaining({
          context: 'OverrideContext',
        }),
      );
    });

    it('should log with metadata', () => {
      const meta = { userId: '123' };
      service.log('Message with metadata', undefined, meta);
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Message with metadata',
        expect.objectContaining({
          userId: '123',
        }),
      );
    });
  });

  describe('error logging', () => {
    it('should log an Error object', () => {
      const error = new Error('Test error');
      service.error(error);
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });

    it('should log a BaseError with its properties', () => {
      const baseError = new BaseError(
        'Test base error',
        ErrorCode.VALIDATION_ERROR,
        400,
        ErrorCategory.VALIDATION,
        { _field: 'test' },
      );

      service.error(baseError);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test base error',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });

    it('should log with trace and context', () => {
      const error = new Error('Test error');
      const trace = 'Custom trace';
      service.error(error, trace, 'ErrorContext');
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test error',
        expect.objectContaining({
          context: 'ErrorContext',
          stack: expect.any(String),
        }),
      );
    });
  });

  describe('warn logging', () => {
    it('should log a warning message', () => {
      service.warn('Warning message');
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Warning message',
        expect.objectContaining({
          context: undefined,
        }),
      );
    });

    it('should log an Error as warning', () => {
      const error = new Error('Warning error');
      service.warn(error);
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Warning error',
        expect.objectContaining({
          stack: expect.any(String),
        }),
      );
    });
  });

  describe('debug logging', () => {
    it('should log a debug message', () => {
      service.debug('Debug message');
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
        'Debug message',
        expect.objectContaining({
          context: undefined,
        }),
      );
    });
  });

  describe('verbose logging', () => {
    it('should log a verbose message', () => {
      service.verbose('Verbose message');
      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(
        'Verbose message',
        expect.objectContaining({
          context: undefined,
        }),
      );
    });
  });
});
