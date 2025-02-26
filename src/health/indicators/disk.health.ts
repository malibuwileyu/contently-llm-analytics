import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  private readonly thresholdPercent: number;
  private readonly mountPoints: string[];

  constructor(private readonly configService: ConfigService) {
    super();
    this.thresholdPercent = this.configService.get('health.disk.thresholdPercent', 90);
    this.mountPoints = this.configService.get('health.disk.mountPoints', ['/']);
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const diskUsage = await this.getDiskUsage();
      const isHealthy = Object.values(diskUsage).every(
        (usage) => usage.usedPercent < this.thresholdPercent
      );

      return this.getStatus(key, isHealthy, { 
        diskUsage,
        threshold: this.thresholdPercent 
      });
    } catch (error) {
      return this.getStatus(key, false, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getDiskUsage(): Promise<Record<string, { total: number; used: number; available: number; usedPercent: number }>> {
    const result: Record<string, any> = {};

    for (const mountPoint of this.mountPoints) {
      try {
        // Use df command to get disk usage information
        const { stdout } = await execAsync(`df -k ${mountPoint} | tail -1`);
        const [, total, used, available, usedPercentStr] = stdout.trim().split(/\s+/);

        result[mountPoint] = {
          total: parseInt(total, 10) * 1024, // Convert to bytes
          used: parseInt(used, 10) * 1024,
          available: parseInt(available, 10) * 1024,
          usedPercent: parseInt(usedPercentStr, 10),
        };
      } catch (error) {
        result[mountPoint] = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return result;
  }
} 