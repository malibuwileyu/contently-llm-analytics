import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseError } from '../errors/base.error';
import { LoggerService } from '../services/logger.service';
import { SentryService } from '../services/sentry.service';
import { ErrorCategory } from '../errors/error-category.enum';
import { UnknownRecord } from '../../types/common';

interface ErrorResponse {
  status: string;
  code: string;
  message: string;
  details?: UnknownRecord;
  timestamp: string;
  path: string;
}

/**
 * Global exception filter that handles all exceptions thrown in the application
 * Works for both REST and GraphQL endpoints
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly sentryService: SentryService,
  ) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request.url;

    let status: HttpStatus;
    let errorResponse: ErrorResponse;

    // Handle different types of errors
    if (exception instanceof BaseError) {
      status = exception.status;
      errorResponse = this.createErrorResponse(
        exception.code,
        exception.message,
        exception.context,
        path,
      );

      // Log based on error category
      if (exception.category === ErrorCategory.VALIDATION || status < 500) {
        this.logger.warn(exception);
      } else {
        this.logger.error(exception);
      }

      // Only capture 5xx errors and auth errors in Sentry
      if (status >= 500 || status === 401 || status === 403) {
        this.sentryService.captureException(exception);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as { message?: string }).message ||
            exception.message
          : exception.message;

      errorResponse = this.createErrorResponse(
        `HTTP_${status}`,
        Array.isArray(message) ? message.join(', ') : message,
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as UnknownRecord)
          : undefined,
        path,
      );

      if (status < 500) {
        this.logger.warn(exception);
        // Only capture auth errors in Sentry for 4xx errors
        if (status === 401 || status === 403) {
          this.sentryService.captureException(exception);
        }
      } else {
        this.logger.error(exception);
        this.sentryService.captureException(exception);
      }
    } else {
      // Unhandled errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      const error = exception as Error;

      errorResponse = this.createErrorResponse(
        'INTERNAL_ERROR',
        error.message || 'Internal server error',
        undefined,
        path,
      );

      this.logger.error(error);
      this.sentryService.captureException(error);
    }

    response.status(status).json(errorResponse);
  }

  private createErrorResponse(
    code: string,
    message: string,
    details?: UnknownRecord,
    path?: string,
  ): ErrorResponse {
    return {
      status: 'error',
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: path || 'unknown',
    };
  }
}
