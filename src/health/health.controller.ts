import { Controller, Get, Param } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
  HealthIndicatorStatus,
} from '@nestjs/terminus';
import { SupabaseService } from '../supabase/supabase.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ExternalServiceHealthIndicator } from './indicators/external-service.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DiskHealthIndicator } from './indicators/disk.health';
import { HealthSchedulerService } from './services/health-scheduler.service';
import { Public } from '../auth/decorators/public.decorator';
import { PrometheusMetricsService } from '../metrics/services/prometheus-metrics.service';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  private readonly selfUrl: string;

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private supabase: SupabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private database: DatabaseHealthIndicator,
    private externalService: ExternalServiceHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private healthScheduler: HealthSchedulerService,
    private metricsService: PrometheusMetricsService,
    private configService: ConfigService,
  ) {
    // Use environment-aware self URL
    const port = this.configService.get<number>('app.port', 3000);
    const apiPrefix = this.configService.get<string>('app.apiPrefix', 'api');
    
    // When running in Docker, use the service name instead of localhost
    const host = process.env.NODE_ENV === 'production' ? 'app' : 'localhost';
    this.selfUrl = `http://${host}:${port}`;
  }

  @Get()
  @Public()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic health check that ensures the application is running
      (): Promise<HealthIndicatorResult> =>
        this.http.pingCheck('self', this.selfUrl),
      // Supabase health check
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.supabase.checkHealth();
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
    ]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check if the application is ready to receive traffic
      (): Promise<HealthIndicatorResult> =>
        this.http.pingCheck('self', this.selfUrl),
      // Check if the database is ready
      (): Promise<HealthIndicatorResult> =>
        this.database.isHealthy('database'),
      // Check if Redis is ready
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
    ]);
  }

  @Get('liveness')
  @Public()
  @HealthCheck()
  liveness(): Promise<HealthCheckResult> {
    // Liveness check is a minimal check to see if the application is running
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.http.pingCheck('self', this.selfUrl),
    ]);
  }

  @Get('database')
  @Public()
  @HealthCheck()
  databaseHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.database.isHealthy('database'),
    ]);
  }

  @Get('cache')
  @Public()
  @HealthCheck()
  cacheHealth(): Promise<HealthCheckResult> {
    return this.health.check([
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
    ]);
  }

  @Get('services')
  @Public()
  @HealthCheck()
  externalServicesHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.externalService.isHealthy('external-services'),
    ]);
  }

  @Get('memory')
  @Public()
  @HealthCheck()
  memoryHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.memory.isHealthy('memory'),
    ]);
  }

  @Get('disk')
  @Public()
  @HealthCheck()
  diskHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.disk.isHealthy('disk'),
    ]);
  }

  @Get('metrics')
  @Public()
  @HealthCheck()
  metricsHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          const metrics = await this.metricsService.getMetrics();
          return {
            metrics: {
              status: metrics ? 'up' : 'down',
            },
          } as HealthIndicatorResult;
        } catch (error) {
          return {
            metrics: {
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          } as HealthIndicatorResult;
        }
      },
    ]);
  }

  @Get('auth')
  @Public()
  @HealthCheck()
  authHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => {
        try {
          // Check if auth configuration is available
          const jwtSecret = this.configService.get<string>('auth.supabase.jwtSecret');
          return {
            auth: {
              status: jwtSecret ? 'up' : 'down',
              message: jwtSecret ? 'Auth configuration is valid' : 'Auth configuration is missing',
            },
          } as HealthIndicatorResult;
        } catch (error) {
          return {
            auth: {
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          } as HealthIndicatorResult;
        }
      },
    ]);
  }

  @Get('status')
  @Public()
  @HealthCheck()
  fullStatus(): Promise<HealthCheckResult> {
    return this.health.check([
      (): Promise<HealthIndicatorResult> =>
        this.http.pingCheck('self', this.selfUrl),
      (): Promise<HealthIndicatorResult> =>
        this.database.isHealthy('database'),
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
      (): Promise<HealthIndicatorResult> =>
        this.externalService.isHealthy('external-services'),
      (): Promise<HealthIndicatorResult> =>
        this.memory.isHealthy('memory'),
      (): Promise<HealthIndicatorResult> =>
        this.disk.isHealthy('disk'),
      async (): Promise<HealthIndicatorResult> => {
        try {
          const metrics = await this.metricsService.getMetrics();
          return {
            metrics: {
              status: metrics ? 'up' : 'down',
            },
          } as HealthIndicatorResult;
        } catch (error) {
          return {
            metrics: {
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          } as HealthIndicatorResult;
        }
      },
      async (): Promise<HealthIndicatorResult> => {
        try {
          // Check if auth configuration is available
          const jwtSecret = this.configService.get<string>('auth.supabase.jwtSecret');
          return {
            auth: {
              status: jwtSecret ? 'up' : 'down',
              message: jwtSecret ? 'Auth configuration is valid' : 'Auth configuration is missing',
            },
          } as HealthIndicatorResult;
        } catch (error) {
          return {
            auth: {
              status: 'down',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
          } as HealthIndicatorResult;
        }
      },
    ]);
  }

  @Get('history')
  @Public()
  async getHealthHistory() {
    return {
      history: await this.healthScheduler.getHealthHistory(),
    };
  }

  @Get('test/:component')
  @Public()
  @HealthCheck()
  testComponent(@Param('component') component: string): Promise<HealthCheckResult> {
    switch (component) {
      case 'database':
        return this.databaseHealth();
      case 'cache':
        return this.cacheHealth();
      case 'services':
        return this.externalServicesHealth();
      case 'memory':
        return this.memoryHealth();
      case 'disk':
        return this.diskHealth();
      case 'metrics':
        return this.metricsHealth();
      case 'auth':
        return this.authHealth();
      default:
        return this.health.check([
          (): Promise<HealthIndicatorResult> => {
            return Promise.resolve({
              [component]: {
                status: 'down' as HealthIndicatorStatus,
                message: `Unknown component: ${component}`,
              },
            });
          },
        ]);
    }
  }
}
