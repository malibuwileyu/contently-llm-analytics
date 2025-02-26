import { Logger } from '@nestjs/common';
import { PrometheusMetricsService } from '../services/prometheus-metrics.service';

/**
 * Options for the TrackExecutionTime decorator
 */
export interface TrackExecutionTimeOptions {
  /** Metric name */
  metricName: string;
  
  /** Labels to apply to the metric */
  labels?: Record<string, string | number>;
  
  /** Whether to log the execution time */
  logExecutionTime?: boolean;
}

/**
 * Decorator for tracking method execution time
 * @param options Decorator options
 */
export function TrackExecutionTime(options: TrackExecutionTimeOptions) {
  const logger = new Logger('TrackExecutionTime');
  
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Get metrics service from the instance
      const metricsService = this.metricsService as PrometheusMetricsService;
      
      if (!metricsService) {
        logger.warn(`Metrics service not found in ${target.constructor.name}`);
        return originalMethod.apply(this, args);
      }
      
      // Start timer
      const endTimer = metricsService.startTimer(
        options.metricName,
        options.labels,
      );
      
      try {
        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // End timer and get duration
        const duration = endTimer();
        
        // Log execution time if enabled
        if (options.logExecutionTime) {
          logger.debug(
            `${target.constructor.name}.${propertyKey} executed in ${duration.toFixed(3)}s`,
          );
        }
        
        return result;
      } catch (error) {
        // End timer even if method throws
        endTimer();
        throw error;
      }
    };
    
    return descriptor;
  };
} 