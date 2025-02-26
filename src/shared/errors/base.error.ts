import { ErrorCategory } from './error-category.enum';

/**
 * Base error class for all domain-specific errors in the application.
 * Extends the built-in Error class with additional properties for error codes,
 * HTTP status codes, and contextual information.
 */
export class BaseError extends Error {
  /**
   * Creates a new BaseError
   * @param message Human-readable error message
   * @param code Unique error code for identifying the error type
   * @param status HTTP status code (defaults to 500)
   * @param category Error category for analytics (defaults to UNEXPECTED)
   * @param context Additional contextual information
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
    public readonly category: ErrorCategory = ErrorCategory.UNEXPECTED,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where the error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a plain object for logging or serialization
   * @returns A plain object representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      category: this.category,
      context: this.context,
      stack: this.stack,
    };
  }
} 