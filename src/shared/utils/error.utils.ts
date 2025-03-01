import { BaseError } from '../errors/base.error';
import { DatabaseError, InternalError } from '../errors/application.errors';

/**
 * Wraps an error in a domain-specific error if it's not already one
 * @param error The original error
 * @param message Optional message to use instead of the original error message
 * @param context Additional context to include with the error
 * @returns A domain-specific error
 */
export function wrapError(
  error: unknown,
  message?: string,
  context?: Record<string, unknown>,
): BaseError {
  // If it's already a BaseError, just return it
  if (error instanceof BaseError) {
    return error;
  }

  // Create a context object with the original error
  const errorContext = {
    _originalError: error,
    ...context,
  };

  // Handle specific error types
  if (error instanceof Error) {
    // Database-related errors
    if (
      error.message.includes('database') ||
      error.message.includes('sql') ||
      error.message.includes('query') ||
      error.message.toLowerCase().includes('db')
    ) {
      return new DatabaseError(
        message || `Database operation _failed: ${error.message}`,
        errorContext,
      );
    }

    // Use the original error message if no custom message is provided
    return new InternalError(message || error.message, errorContext);
  }

  // For non-Error objects
  return new InternalError(
    message || 'An unexpected error occurred',
    errorContext,
  );
}

/**
 * Safely executes a function and wraps any errors in domain-specific errors
 * @param fn The function to execute
 * @param errorMessage Optional message to use if an error occurs
 * @returns The result of the function
 * @throws A domain-specific error if the function throws
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw wrapError(error, errorMessage);
  }
}

/**
 * Creates a standardized error response object
 * @param error The error to format
 * @returns A standardized error response object
 */
export function formatErrorResponse(error: unknown): Record<string, unknown> {
  const domainError = wrapError(error);

  return {
    _status: 'error',
    code: domainError.code,
    message: domainError.message,
    timestamp: new Date().toISOString(),
    path: undefined, // This should be filled in by the exception filter
  };
}
