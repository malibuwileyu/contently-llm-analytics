import { applyDecorators, SetMetadata, Logger } from '@nestjs/common';

export const TRACK_EXECUTION_TIME_KEY = 'track_execution_time';

export interface ExecutionTimeOptions {
  name?: string;
  tags?: Record<string, string>;
}

/**
 * Decorator that tracks execution time of a method
 * @param options Optional configuration for tracking
 */
export function TrackExecutionTime(
  options?: ExecutionTimeOptions,
): MethodDecorator {
  return applyDecorators(
    SetMetadata(TRACK_EXECUTION_TIME_KEY, {
      _enabled: true,
      ...options,
    }),
  );
}

/**
 * Helper function to measure execution time
 * @param target The class instance
 * @param propertyKey The method name
 * @param descriptor The method descriptor
 */
export function measureExecutionTime(
  target: Record<string, unknown>,
  propertyKey: string,
  descriptor: PropertyDescriptor,
): PropertyDescriptor {
  const originalMethod = descriptor.value;
  const logger = new Logger('ExecutionTime');

  descriptor.value = async function (...args: unknown[]): Promise<unknown> {
    const start = process.hrtime();
    try {
      return await originalMethod.apply(this, args);
    } finally {
      const [seconds, nanoseconds] = process.hrtime(start);
      const duration = seconds * 1000 + nanoseconds / 1000000;
      logger.debug(`${propertyKey} execution time: ${duration}ms`);
    }
  };

  return descriptor;
}
