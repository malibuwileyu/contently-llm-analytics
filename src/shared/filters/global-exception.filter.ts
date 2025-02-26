import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { BaseError } from '../errors/base.error';
import { ValidationError, NotFoundError } from '../errors/application.errors';
import { LoggerService } from '../services/logger.service';
import { SentryService } from '../services/sentry.service';
import { ErrorCategory } from '../errors/error-category.enum';
import { formatErrorResponse, wrapError } from '../utils/error.utils';

interface ErrorResponse {
  status: string;
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

/**
 * Global exception filter that handles all exceptions thrown in the application
 * Works for both REST and GraphQL endpoints
 */
@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter, GqlExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly sentryService: SentryService
  ) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  /**
   * Catch and handle any exception
   * @param exception The thrown exception
   * @param host The arguments host
   */
  catch(exception: unknown, host: ArgumentsHost) {
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
        path
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
      const message = typeof exceptionResponse === 'object' 
        ? (exceptionResponse as any).message || exception.message
        : exception.message;
      
      errorResponse = this.createErrorResponse(
        `HTTP_${status}`,
        Array.isArray(message) ? message.join(', ') : message,
        typeof exceptionResponse === 'object' ? exceptionResponse : undefined,
        path
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
        path
      );

      this.logger.error(error);
      this.sentryService.captureException(error);
    }

    response.status(status).json(errorResponse);
  }

  /**
   * Handle HTTP exceptions
   * @param exception The thrown exception
   * @param host The arguments host
   */
  private handleHttpException(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // Convert to domain error
    const error = this.normalizeError(exception);
    
    // Log the error
    this.logError(error, request);
    
    // Create standardized error response
    const errorResponse = formatErrorResponse(error);
    errorResponse.path = request.url;
    
    // Send response
    response.status(error.status).json(errorResponse);
  }

  /**
   * Handle GraphQL exceptions
   * @param exception The thrown exception
   * @param gqlHost The GraphQL arguments host
   */
  private handleGraphQLException(
    exception: unknown,
    gqlHost: GqlArgumentsHost,
  ): Error {
    const { req } = gqlHost.getContext();
    
    // Convert to domain error
    const error = this.normalizeError(exception);
    
    // Log the error
    this.logError(error, req);
    
    // For GraphQL, we need to return an Error object
    // The extensions will be included in the GraphQL response
    const gqlError = new Error(error.message);
    (gqlError as any).extensions = {
      code: error.code,
      status: error.status,
      timestamp: new Date().toISOString(),
      path: req?.url,
    };
    
    return gqlError;
  }

  /**
   * Normalize any error to a BaseError
   * @param exception The exception to normalize
   * @returns A BaseError instance
   */
  private normalizeError(exception: unknown): BaseError {
    // If it's already a BaseError, just return it
    if (exception instanceof BaseError) {
      return exception;
    }
    
    // If it's an HTTP exception, convert it to a BaseError
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      
      const message = typeof response === 'string'
        ? response
        : (response as any).message || exception.message;
      
      return wrapError(exception, message, {
        status,
        response,
      });
    }
    
    // For any other error, wrap it
    return wrapError(exception);
  }

  /**
   * Log the error with appropriate context
   * @param error The error to log
   * @param request The request object
   */
  private logError(error: BaseError, request?: Request): void {
    const context = {
      url: request?.url,
      method: request?.method,
      headers: this.sanitizeHeaders(request?.headers),
      query: request?.query,
      params: request?.params,
      userId: request?.user ? (request.user as any).id : undefined,
    };
    
    // Log with different levels based on status code
    if (error.status >= 500) {
      this.logger.error(error, error.stack, 'ExceptionFilter', context);
    } else if (error.status >= 400) {
      this.logger.warn(error, 'ExceptionFilter', context);
    } else {
      this.logger.debug(error, 'ExceptionFilter', context);
    }
  }

  /**
   * Sanitize headers to remove sensitive information
   * @param headers The headers object
   * @returns Sanitized headers
   */
  private sanitizeHeaders(headers?: Record<string, unknown>): Record<string, unknown> {
    if (!headers) {
      return {};
    }
    
    const sanitized = { ...headers };
    
    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
    ];
    
    sensitiveHeaders.forEach(header => {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Create a standardized error response object
   * @param code Error code
   * @param message Error message
   * @param details Additional error details
   * @param path Request path
   * @returns Standardized error response
   */
  private createErrorResponse(
    code: string,
    message: string,
    details?: any,
    path?: string
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