import { Injectable } from '@nestjs/common';

/**
 * Service for metrics collection and reporting
 */
@Injectable()
export class MetricsService {
  /**
   * Records the duration of an analysis operation
   * @param duration The duration in milliseconds
   * @param metadata Additional metadata about the operation
   */
  recordAnalysisDuration(duration: number, metadata?: Record<string, any>): void {
    // In a real implementation, this would send metrics to a monitoring system
    // For now, we'll use a placeholder implementation
    console.log(`Analysis duration: ${duration}ms`, metadata);
  }

  /**
   * Increments the error count for a specific error type
   * @param errorType The type of error
   * @param metadata Additional metadata about the error
   */
  incrementErrorCount(errorType: string, metadata?: Record<string, any>): void {
    // In a real implementation, this would send metrics to a monitoring system
    // For now, we'll use a placeholder implementation
    console.log(`Error count incremented for: ${errorType}`, metadata);
  }
} 