import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { SupabaseService } from '../supabase/supabase.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private supabase: SupabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic health check that ensures the application is running
      (): Promise<HealthIndicatorResult> =>
        this.http.pingCheck('self', 'http://localhost:3000'),
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
}
