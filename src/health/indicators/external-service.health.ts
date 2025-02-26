import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExternalServiceHealthIndicator extends HealthIndicator {
  private readonly externalServices: Record<string, string>;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    super();
    // Load external service endpoints from configuration
    this.externalServices = this.configService.get('externalServices', {});
    this.timeoutMs = this.configService.get('health.timeout', 5000);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const serviceStatuses: Record<string, any> = {};
    let isAllHealthy = true;

    for (const [serviceName, endpoint] of Object.entries(this.externalServices)) {
      try {
        // Make a request to the service health endpoint with timeout
        const response$ = this.httpService.get(endpoint).pipe(
          timeout(this.timeoutMs)
        );
        
        const response = await firstValueFrom(response$);
        
        // Check if the response status is in the 2xx range
        const isServiceHealthy = response.status >= 200 && response.status < 300;
        
        serviceStatuses[serviceName] = {
          status: isServiceHealthy ? 'up' : 'down',
          statusCode: response.status,
        };
        
        if (!isServiceHealthy) {
          isAllHealthy = false;
        }
      } catch (error) {
        serviceStatuses[serviceName] = {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        isAllHealthy = false;
      }
    }

    return this.getStatus(key, isAllHealthy, { services: serviceStatuses });
  }
} 