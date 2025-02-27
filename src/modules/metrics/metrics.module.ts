import { Module } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';

/**
 * Module for metrics collection and reporting
 */
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {} 