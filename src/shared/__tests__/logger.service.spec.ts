import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from '../services/logger.service';
import { BaseError } from '../errors/base.error';
import { ErrorCode } from '../errors/application.errors';
import { ErrorCategory } from '../errors/error-category.enum';
import * as winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  
  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };
  
  return {
    format: mockFormat,
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  };
});

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: any;
  let module: TestingModule;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    module = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
    mockWinstonLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setContext', () => {
    it('should set the context and return this', () => {
      const result = service.setContext('TestContext');
      expect(result).toBe(service);
    });
  });

  describe('log methods', () => {
    it('should call info for log method', () => {
      const spy = jest.spyOn(service, 'info');
      service.log('Test message');
      expect(spy).toHaveBeenCalledWith('Test message', undefined);
    });

    it('should log a simple message', () => {
      service.info('Test message');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: undefined,
      });
    });

    it('should log with context', () => {
      service.setContext('TestContext');
      service.info('Test message');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'TestContext',
      });
    });

    it('should log with override context', () => {
      service.setContext('DefaultContext');
      service.info('Test message', 'OverrideContext');
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: 'OverrideContext',
      });
    });

    it('should log with metadata', () => {
      service.info('Test message', undefined, { key: 'value' });
      expect(mockWinstonLogger.info).toHaveBeenCalledWith('Test message', {
        context: undefined,
        key: 'value',
      });
    });
  });

  describe('error logging', () => {
    it('should log an Error object', () => {
      const error = new Error('Test error');
      service.error(error);
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Test error', {
        context: undefined,
        stack: error.stack,
      });
    });

    it('should log a BaseError with its properties', () => {
      const baseError = new BaseError(
        'Test base error',
        ErrorCode.VALIDATION_ERROR,
        400,
        ErrorCategory.VALIDATION,
        { field: 'test' },
      );
      
      service.error(baseError);
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Test base error', {
        context: undefined,
        stack: baseError.stack,
        code: ErrorCode.VALIDATION_ERROR,
        status: 400,
        errorContext: { field: 'test' },
      });
    });

    it('should log with trace and context', () => {
      const error = new Error('Test error');
      const trace = 'Custom trace';
      service.error(error, trace, 'ErrorContext');
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith('Test error', {
        context: 'ErrorContext',
        stack: trace,
      });
    });
  });

  describe('warn logging', () => {
    it('should log a warning message', () => {
      service.warn('Warning message');
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning message', {
        context: undefined,
      });
    });

    it('should log an Error as warning', () => {
      const error = new Error('Warning error');
      service.warn(error);
      
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith('Warning error', {
        context: undefined,
        stack: error.stack,
      });
    });
  });

  describe('debug logging', () => {
    it('should log a debug message', () => {
      service.debug('Debug message');
      expect(mockWinstonLogger.debug).toHaveBeenCalledWith('Debug message', {
        context: undefined,
      });
    });
  });

  describe('verbose logging', () => {
    it('should log a verbose message', () => {
      service.verbose('Verbose message');
      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith('Verbose message', {
        context: undefined,
      });
    });
  });
}); 