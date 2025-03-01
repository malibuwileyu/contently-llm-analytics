import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';
import { PrometheusMetricsService } from '../services/prometheus-metrics.service';
import { MetricsConfig } from '../../config/metrics.config';

interface HttpMetricsLabels {
  method: string;
  path: string;
  status?: string | number;
}

/**
 * Interceptor for tracking HTTP request metrics
 */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpMetricsInterceptor.name);

  constructor(
    private readonly metricsService: PrometheusMetricsService,
    @Inject('METRICS_CONFIG') private readonly config: MetricsConfig,
  ) {}

  /**
   * Intercepts HTTP requests to track metrics
   * @param context Execution context
   * @param next Call handler
   * @returns Observable of the response
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (!this.config._enabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    // Skip metrics endpoint to avoid circular metrics
    if (path === this.config.endpoint) {
      return next.handle();
    }

    // Start timer for request duration
    const endTimer = this.metricsService.startTimer(
      `${this.config.prefix}http_request_duration_seconds`,
      { method, path } as HttpMetricsLabels,
    );

    return next.handle().pipe(
      tap(() => {
        // Increment request counter on success
        const labels: HttpMetricsLabels = {
          method,
          path,
          status: context.switchToHttp().getResponse().statusCode,
        };
        this.metricsService.incrementCounter(
          `${this.config.prefix}http_requests_total`,
          1,
          labels,
        );
      }),
      finalize(() => {
        // End timer and observe duration
        const duration = endTimer();

        // Add status code to labels
        const status = context.switchToHttp().getResponse().statusCode;
        const labels: HttpMetricsLabels = { method, path, status };

        this.metricsService.observeHistogram(
          `${this.config.prefix}http_request_duration_seconds`,
          duration,
          labels,
        );

        this.logger.debug(
          `${method} ${path} completed in ${duration.toFixed(3)}s with status ${status}`,
        );
      }),
    );
  }
}
