import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import {
  HealthCheckResult,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
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
    try {
      return await this.db.pingCheck('database', { timeout: 1000 });
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return {
        database: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }

  async checkLiveness(): Promise<HealthIndicatorResult> {
    return {
      liveness: {
        status: 'up',
        details: {
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
      },
    };
  }

  async checkReadiness(): Promise<HealthIndicatorResult> {
    try {
      await this.connection.query('SELECT 1');
      return {
        readiness: {
          status: 'up',
          details: {
            database: 'connected',
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      this.logger.error('Readiness check failed:', error);
      return {
        readiness: {
          status: 'down',
          error: error.message,
        },
      };
    }
  }
}
