import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckService,
  HealthCheckResult,
  HealthIndicatorResult,
  HttpHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DatabaseHealthIndicator } from '../indicators/database.health';
import { ExternalServiceHealthIndicator } from '../indicators/external-service.health';
import { PrometheusMetricsService } from '../../metrics/services/prometheus-metrics.service';
import { SupabaseHealthIndicator } from '../indicators/supabase.health';

interface HealthEntry {
  timestamp: string;
  status: string;
  duration: number;
  details: HealthCheckResult;
}

interface HealthError {
  timestamp: string;
  status: string;
  error: string;
}

export type HealthHistoryEntry = HealthEntry | HealthError;

@Injectable()
export class HealthSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('HealthSchedulerService');
  private readonly checkIntervalMs: number;
  private readonly healthHistorySize: number;
  private readonly healthHistoryKey = 'health:history';
  private readonly selfUrl: string;
  private intervalId: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthCheckService: HealthCheckService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly http: HttpHealthIndicator,
    private readonly database: DatabaseHealthIndicator,
    private readonly externalService: ExternalServiceHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly _metricsService: PrometheusMetricsService,
    private readonly supabaseHealthIndicator: SupabaseHealthIndicator,
  ) {
    this.checkIntervalMs =
      this.configService.get('health.checkInterval', 60000) || 60000; // Default: 1 minute
    this.healthHistorySize = this.configService.get('health.historySize', 100); // Default: 100 entries

    // Use environment-aware self URL
    const port = this.configService.get<number>('app.port', 3000);
    const host = process.env.NODE_ENV === 'production' ? 'app' : 'localhost';
    this.selfUrl = `http://${host}:${port}/health`;
  }

  async onModuleInit(): Promise<void> {
    this.scheduleHealthChecks();
  }

  onModuleDestroy(): void {
    this.stopHealthChecks();
  }

  private scheduleHealthChecks(): void {
    this.intervalId = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.logger.error(
          `Failed to perform scheduled health check: ${error.message}`,
          error._stack,
        );
      });
    }, this.checkIntervalMs);

    this.logger.log(`Scheduled health checks every ${this.checkIntervalMs}ms`);
  }

  private stopHealthChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Stopped scheduled health checks');
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();
      const healthResult = await this.healthCheckService.check([
        // Database health check
        (): Promise<HealthIndicatorResult> =>
          this.database.isHealthy('database'),
        // Redis health check
        async (): Promise<HealthIndicatorResult> => {
          try {
            await this.cacheManager.set('health-check', 'ok', 10);
            const result = await this.cacheManager.get('health-check');
            return {
              redis: {
                status: result === 'ok' ? 'up' : 'down',
              },
            } as HealthIndicatorResult;
          } catch (error) {
            return {
              redis: {
                status: 'down',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            } as HealthIndicatorResult;
          }
        },
        // External services health check
        (): Promise<HealthIndicatorResult> =>
          this.externalService.isHealthy('external-services'),
        // Memory health check
        (): Promise<HealthIndicatorResult> =>
          this.memory.checkHeap('memory', 150 * 1024 * 1024), // 150MB heap limit
        // Disk health check
        (): Promise<HealthIndicatorResult> =>
          this.disk.checkStorage('disk', {
            thresholdPercent: 0.9, // 90% threshold
            path: '/',
          }),
        // Metrics health check
        async (): Promise<HealthIndicatorResult> => {
          return {
            metrics: {
              status: 'up',
              message: 'Metrics service not yet implemented',
            },
          } as HealthIndicatorResult;
        },
        // Supabase health check
        async (): Promise<HealthIndicatorResult> => {
          try {
            await this.supabaseHealthIndicator.isHealthy('supabase');
            return {
              supabase: {
                status: 'up',
              },
            } as HealthIndicatorResult;
          } catch (error) {
            return {
              supabase: {
                status: 'down',
                error: error instanceof Error ? error.message : 'Unknown error',
              },
            } as HealthIndicatorResult;
          }
        },
      ]);

      const duration = Date.now() - startTime;
      const healthEntry: HealthEntry = {
        timestamp: new Date().toISOString(),
        status: healthResult.status,
        duration,
        details: healthResult,
      };

      await this.storeHealthHistory(healthEntry);
      this.logger.debug(
        `Health check completed in ${duration}ms with status: ${healthResult.status}`,
      );

      return healthResult;
    } catch (error) {
      this.logger.error('Failed to perform health check', error);

      // Store the error as a failed health check
      const healthError: HealthError = {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      await this.storeHealthHistory(healthError);
      throw error;
    }
  }

  private async storeHealthHistory(
    healthEntry: HealthHistoryEntry,
  ): Promise<void> {
    try {
      // Get current health history
      const history =
        (await this.cacheManager.get<HealthHistoryEntry[]>(
          this.healthHistoryKey,
        )) || [];

      // Add new entry to the beginning
      history.unshift(healthEntry);

      // Limit history size
      if (history.length > this.healthHistorySize) {
        history.length = this.healthHistorySize;
      }

      // Store updated history
      await this.cacheManager.set(this.healthHistoryKey, history);
    } catch (error) {
      this.logger.error(
        `Failed to store health history: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getHealthHistory(): Promise<HealthHistoryEntry[]> {
    return (
      (await this.cacheManager.get<HealthHistoryEntry[]>(
        this.healthHistoryKey,
      )) || []
    );
  }
}
