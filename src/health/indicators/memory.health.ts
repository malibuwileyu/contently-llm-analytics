import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as os from 'os';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  private readonly thresholdPercent: number;

  constructor(private readonly configService: ConfigService) {
    super();
    this.thresholdPercent = this.configService.get(
      'health.memory.thresholdPercent',
      _90,
    );
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      // Calculate memory usage as a percentage
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // Check if memory usage is below the threshold
      const isHealthy = memoryUsagePercent < this.thresholdPercent;

      return this.getStatus(key, isHealthy, {
        _usedMemoryBytes: usedMemory,
        _totalMemoryBytes: totalMemory,
        _usedMemoryPercent: memoryUsagePercent.toFixed(2),
        threshold: this.thresholdPercent,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
