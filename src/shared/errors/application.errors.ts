import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';
import { ErrorCategory } from './error-category.enum';

/**
 * Error codes for the application
 */
export enum ErrorCode {
  // Validation errors (400 range)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication errors (401, 403 range)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Resource errors (404, 409 range)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Business logic errors (422 range)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // External service errors (502, 503, 504 range)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  
  // System errors (500 range)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

/**
 * Validation error - used when input data fails validation
 */
export class ValidationError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      ErrorCategory.VALIDATION,
      context,
    );
  }
}

/**
 * Not found error - used when a requested resource doesn't exist
 */
export class NotFoundError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      ErrorCategory.RESOURCE_NOT_FOUND,
      context,
    );
  }
}

/**
 * Unauthorized error - used for authentication failures
 */
export class UnauthorizedError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      HttpStatus.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      context,
    );
  }
}

/**
 * Forbidden error - used for authorization failures
 */
export class ForbiddenError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.FORBIDDEN,
      HttpStatus.FORBIDDEN,
      ErrorCategory.AUTHORIZATION,
      context,
    );
  }
}

/**
 * Conflict error - used when an operation would create a conflict
 */
export class ConflictError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.CONFLICT,
      HttpStatus.CONFLICT,
      ErrorCategory.RESOURCE_CONFLICT,
      context,
    );
  }
}

/**
 * Business logic error - used when a business rule is violated
 */
export class BusinessError extends BaseError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.BUSINESS_RULE_VIOLATION,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      code,
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCategory.BUSINESS_LOGIC,
      context,
    );
  }
}

/**
 * External service error - used when an external service fails
 */
export class ExternalServiceError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      HttpStatus.BAD_GATEWAY,
      ErrorCategory.EXTERNAL_SERVICE,
      context,
    );
  }
}

/**
 * Database error - used for database-related errors
 */
export class DatabaseError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.DATABASE_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCategory.DATABASE,
      context,
    );
  }
}

/**
 * Internal error - used for unexpected system errors
 */
export class InternalError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.INTERNAL_ERROR,
      HttpStatus.INTERNAL_SERVER_ERROR,
      ErrorCategory.SYSTEM,
      context,
    );
  }
}

/**
 * Timeout error - used when an operation times out
 */
export class TimeoutError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
  ) {
    super(
      message,
      ErrorCode.TIMEOUT,
      HttpStatus.GATEWAY_TIMEOUT,
      ErrorCategory.TIMEOUT,
      context,
    );
  }
} 