import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SentryService } from '../services/sentry.service';
import { Request } from 'express';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UnknownRecord } from '../../types/common';

/**
 * Interceptor that captures exceptions and sends them to Sentry
 * Works for both HTTP and GraphQL requests
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  constructor(private readonly sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError(error => {
        // Don't report 4xx errors to Sentry unless they're 401 or 403
        if (
          error instanceof HttpException &&
          error.getStatus() >= 400 &&
          error.getStatus() < 500 &&
          error.getStatus() !== 401 &&
          error.getStatus() !== 403
        ) {
          return throwError(() => error);
        }

        // Get request context based on type
        const requestContext = this.getRequestContext(context);

        // Capture the error in Sentry
        this.sentryService.captureException(error, requestContext);

        // Re-throw the error
        return throwError(() => error);
      }),
    );
  }

  /**
   * Get request context based on execution context type
   * @param context The execution context
   * @returns Request context for Sentry
   */
  private getRequestContext(context: ExecutionContext): UnknownRecord {
    const contextType = context.getType() as string;

    // Handle HTTP requests
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      return this.extractHttpContext(request);
    }

    // Handle GraphQL requests
    if (contextType === 'graphql') {
      try {
        const gqlContext = GqlExecutionContext.create(context);
        const { req } = gqlContext.getContext();
        const info = gqlContext.getInfo();

        if (req && info) {
          return {
            ...this.extractHttpContext(req),
            graphql: {
              operation: info.operation?.operation,
              fieldName: info.fieldName,
            },
          };
        }
      } catch (error) {
        // If we can't extract GraphQL context, just return the context type
        return { contextType };
      }
    }

    // Default context
    return {
      contextType,
    };
  }

  /**
   * Extract context from HTTP request
   * @param request The HTTP request
   * @returns HTTP context for Sentry
   */
  private extractHttpContext(request: Request): UnknownRecord {
    if (!request) {
      return {};
    }

    const { method, url, headers, query, params, body } = request;

    // Get user ID if available
    const userId = request.user?.id;

    // Sanitize headers to remove sensitive information
    const sanitizedHeaders = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    sensitiveHeaders.forEach(header => {
      if (header in sanitizedHeaders) {
        sanitizedHeaders[header] = '[REDACTED]';
      }
    });

    // Sanitize body to remove sensitive information
    const sanitizedBody = body ? this.sanitizeBody(body) : undefined;

    return {
      request: {
        method,
        url,
        headers: sanitizedHeaders,
        query,
        params,
      },
      user: userId ? { id: userId } : undefined,
      body: sanitizedBody,
    };
  }

  /**
   * Sanitize request body to remove sensitive information
   * @param body The request body
   * @returns Sanitized body
   */
  private sanitizeBody(body: UnknownRecord): UnknownRecord {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
    ];
    const sanitized = { ...body };

    // Redact sensitive fields
    Object.keys(sanitized).forEach(key => {
      if (
        sensitiveFields.some(field =>
          key.toLowerCase().includes(field.toLowerCase()),
        )
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (
        typeof sanitized[key] === 'object' &&
        sanitized[key] !== null
      ) {
        sanitized[key] = this.sanitizeBody(sanitized[key] as UnknownRecord);
      }
    });

    return sanitized;
  }
}
