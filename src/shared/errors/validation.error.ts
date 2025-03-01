import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';
import { ErrorCategory } from './error-category.enum';

export class ValidationError extends BaseError {
  constructor(
    message: string,
    validationErrors?: Record<string, unknown>,
    code: string = 'VALIDATION_ERROR',
  ) {
    super(
      message,
      code,
      HttpStatus.BAD_REQUEST,
      ErrorCategory.VALIDATION,
      validationErrors,
    );
    this.name = 'ValidationError';
  }
}
