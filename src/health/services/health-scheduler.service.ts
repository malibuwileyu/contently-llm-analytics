import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheckService } from '@nestjs/terminus';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class HealthSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthSchedulerService.name);
  private readonly checkIntervalMs: number;
  private readonly healthHistorySize: number;
  private readonly healthHistoryKey = 'health:history';
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthCheckService: HealthCheckService,
    private readonly cacheService: CacheService,
  ) {
    this.checkIntervalMs = this.configService.get('health.checkInterval', 60000); // Default: 1 minute
    this.healthHistorySize = this.configService.get('health.historySize', 100); // Default: 100 entries
  }

  async onModuleInit() {
    this.scheduleHealthChecks();
  }

  onModuleDestroy() {
    this.stopHealthChecks();
  }

  private scheduleHealthChecks() {
    this.intervalId = setInterval(() => {
      this.performHealthCheck().catch(error => {
        this.logger.error(`Failed to perform scheduled health check: ${error.message}`, error.stack);
      });
    }, this.checkIntervalMs);

    this.logger.log(`Scheduled health checks every ${this.checkIntervalMs}ms`);
  }

  private stopHealthChecks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.logger.log('Stopped scheduled health checks');
    }
  }

  private async performHealthCheck() {
    try {
      const startTime = Date.now();
      const healthResult = await this.healthCheckService.check([]);
      const duration = Date.now() - startTime;

      const healthEntry = {
        timestamp: new Date().toISOString(),
        status: healthResult.status,
        duration,
        details: healthResult,
      };

      await this.storeHealthHistory(healthEntry);
      this.logger.debug(`Health check completed in ${duration}ms with status: ${healthResult.status}`);
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      
      // Store the error as a failed health check
      const healthEntry = {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      
      await this.storeHealthHistory(healthEntry);
    }
  }

  private async storeHealthHistory(healthEntry: any) {
    try {
      // Get current health history
      const history = await this.cacheService.get<any[]>(this.healthHistoryKey) || [];
      
      // Add new entry to the beginning
      history.unshift(healthEntry);
      
      // Limit history size
      if (history.length > this.healthHistorySize) {
        history.length = this.healthHistorySize;
      }
      
      // Store updated history
      await this.cacheService.set(this.healthHistoryKey, history);
    } catch (error) {
      this.logger.error(`Failed to store health history: ${error.message}`, error.stack);
    }
  }

  async getHealthHistory(): Promise<any[]> {
    return await this.cacheService.get<any[]>(this.healthHistoryKey) || [];
  }
} 