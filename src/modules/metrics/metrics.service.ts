import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for tracking metrics
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  /**
   * Track an event
   * @param eventName Name of the event
   * @param properties Properties of the event
   */
  trackEvent(eventName: string, properties: Record<string, unknown>): void {
    // In a real implementation, this would send the event to a metrics service
    this.logger.log(`[Metrics] ${eventName}:`, properties);
  }

  /**
   * Track a timing event
   * @param category Category of the timing
   * @param variable Variable being timed
   * @param time Time in milliseconds
   * @param properties Additional properties
   */
  trackTiming(
    category: string,
    variable: string,
    time: number,
    properties?: Record<string, unknown>,
  ): void {
    // In a real implementation, this would send the timing to a metrics service
    this.logger.log(
      `[Metrics] Timing ${category}.${variable}: ${time}ms`,
      properties || {},
    );
  }

  /**
   * Record analysis duration
   * @param duration Duration in milliseconds
   */
  recordAnalysisDuration(duration: number): void {
    this.trackTiming('analysis', 'duration', duration);
  }

  /**
   * Increment error count
   * @param errorType Type of error
   */
  incrementErrorCount(errorType: string): void {
    this.trackEvent('error', { type: errorType });
  }
}
