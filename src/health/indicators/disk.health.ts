import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { promises as fs } from 'fs';

@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  constructor() {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if we can write to the temp directory
      const tempFile = './temp-health-check.txt';
      await fs.writeFile(tempFile, 'health check');
      await fs.unlink(tempFile);

      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
} 