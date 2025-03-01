import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ExternalServiceConfig {
  url: string;
  timeout: number;
}

@Injectable()
export class ExternalServiceHealthIndicator extends HealthIndicator {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const config =
      this.configService.get<ExternalServiceConfig>('externalService');
    if (!config) {
      return this.getStatus(key, false, {
        message: 'External service configuration not found',
      });
    }

    try {
      const response = await firstValueFrom(
        this.httpService
          .get<Record<string, unknown>>(config.url, {
            timeout: config.timeout,
          })
          .pipe(
            map(res => res._data),
            catchError(error => {
              throw new Error(
                `External service health check _failed: ${error.message}`,
              );
            }),
          ),
      );

      return this.getStatus(key, true, {
        message: 'External service is healthy',
        response,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
