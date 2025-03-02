import { Controller, Get, Header, Inject, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetricsConfig } from '../../config/metrics.config';
import { PrometheusMetricsService } from '../services/prometheus-metrics.service';

/**
 * Controller for exposing Prometheus metrics
 */
@ApiTags('Metrics')
@Controller()
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    private readonly metricsService: PrometheusMetricsService,
    @Inject('METRICS_CONFIG') private readonly config: MetricsConfig,
  ) {}

  /**
   * Gets all metrics in Prometheus format
   * @returns Metrics in Prometheus format
   */
  @Get()
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Metrics in Prometheus format',
    type: String,
  })
  async getMetrics(): Promise<string> {
    this.logger.debug('Getting metrics');
    return this.metricsService.getMetrics();
  }
}
