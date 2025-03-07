import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
  HealthCheckResult,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
  HealthIndicatorStatus,
} from '@nestjs/terminus';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly db: TypeOrmHealthIndicator,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async checkDatabase(): Promise<HealthIndicatorResult> {
    this.logger.debug('Starting database health check...');
    try {
      const result = await this.db.pingCheck('database', { timeout: 5000 });
      this.logger.debug('Database health check completed successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        database: {
          status: 'down' as HealthIndicatorStatus,
          error: error.message,
        },
      };
    }
  }

  async checkLiveness(): Promise<HealthIndicatorResult> {
    this.logger.debug('Starting liveness check...');
    const result = {
      liveness: {
        status: 'up' as HealthIndicatorStatus,
        details: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      },
    };
    this.logger.debug('Liveness check completed:', result);
    return result;
  }

  async checkReadiness(): Promise<HealthIndicatorResult> {
    this.logger.debug('Starting readiness check...');
    try {
      await this.connection.query('SELECT 1');
      const result = {
        readiness: {
          status: 'up' as HealthIndicatorStatus,
          details: {
            database: 'connected',
            timestamp: new Date().toISOString(),
          },
        },
      };
      this.logger.debug('Readiness check completed successfully:', result);
      return result;
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return {
        readiness: {
          status: 'down' as HealthIndicatorStatus,
          error: error.message,
        },
      };
    }
  }
}
