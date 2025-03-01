import { HttpStatus } from '@nestjs/common';
import { BaseError } from './base.error';
import { ErrorCategory } from './error-category.enum';

export class NotFoundError extends BaseError {
  constructor(
    message: string,
    context?: Record<string, unknown>,
    code: string = 'NOT_FOUND',
  ) {
    super(
      message,
      code,
      HttpStatus.NOT_FOUND,
      ErrorCategory.RESOURCE_NOT_FOUND,
      context,
    );
    this.name = 'NotFoundError';
  }
}
