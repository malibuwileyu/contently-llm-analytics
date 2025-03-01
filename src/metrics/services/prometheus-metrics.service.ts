import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, Summary } from 'prom-client';
import { MetricsConfig } from '../../config/metrics.config';
import {
  CounterOptions,
  GaugeOptions,
  HistogramOptions,
  MetricsService,
  SummaryOptions,
} from '../interfaces/metrics.interface';
import { ConfigService } from '@nestjs/config';

// Create a static registry to be shared across all instances
// This helps prevent "already registered" errors in tests
const _globalRegistry = new Registry();

/**
 * Prometheus metrics service implementation
 */
@Injectable()
export class PrometheusMetricsService implements MetricsService, OnModuleInit {
  private readonly logger = new Logger(PrometheusMetricsService.name);
  private readonly registry: Registry;
  private readonly counters: Map<string, Counter<string>> = new Map();
  private readonly gauges: Map<string, Gauge<string>> = new Map();
  private readonly histograms: Map<string, Histogram<string>> = new Map();
  private readonly summaries: Map<string, Summary<string>> = new Map();
  private readonly config: MetricsConfig;
  private initialized = false;
  private static instanceCount = 0;

  constructor(private readonly configService: ConfigService) {
    PrometheusMetricsService.instanceCount++;

    // Create a new registry
    this.registry = new Registry();

    // Get metrics configuration
    this.config = this.configService.get<MetricsConfig>('metrics') || {
      enabled: false,
      prefix: 'app_',
      endpoint: '/metrics',
      defaultLabels: {},
      collectDefaultMetrics: true,
      defaultMetricsInterval: 10000,
    };

    // Set default labels
    this.registry.setDefaultLabels(this.config.defaultLabels);
  }

  /**
   * Initialize the metrics service
   */
  onModuleInit(): void {
    if (this.config.enabled && !this.initialized) {
      this.logger.log('Initializing Prometheus metrics service');

      if (this.config.collectDefaultMetrics) {
        this.logger.log('Collecting default metrics');
        require('prom-client').collectDefaultMetrics({
          register: this.registry,
          prefix: this.config.prefix,
          _timeout: this.config.defaultMetricsInterval,
        });
      }

      // Register application-specific metrics
      this.registerApplicationMetrics();
      this.initialized = true;
    } else if (!this.config.enabled) {
      this.logger.log('Prometheus metrics service is disabled');
    }
  }

  /**
   * Clear the registry and all metric collections
   * Useful for testing to prevent "already registered" errors
   */
  clearRegistry(): void {
    // Only clear if this is the last instance
    PrometheusMetricsService.instanceCount--;
    if (PrometheusMetricsService.instanceCount <= 0) {
      PrometheusMetricsService.instanceCount = 0;
      this.registry.clear();
      this.counters.clear();
      this.gauges.clear();
      this.histograms.clear();
      this.summaries.clear();
      this.initialized = false;
      this.logger.debug('Cleared metrics registry');
    }
  }

  /**
   * Register application-specific metrics
   */
  private registerApplicationMetrics(): void {
    try {
      // HTTP metrics
      this.createCounter({
        name: `${this.config.prefix}http_requests_total`,
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'path', 'status'],
      });

      this.createHistogram({
        name: `${this.config.prefix}http_request_duration_seconds`,
        help: 'HTTP request duration in seconds',
        labelNames: ['method', 'path', 'status'],
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      });

      // Cache metrics
      this.createCounter({
        name: `${this.config.prefix}cache_hits_total`,
        help: 'Total number of cache hits',
        labelNames: ['cache'],
      });

      this.createCounter({
        name: `${this.config.prefix}cache_misses_total`,
        help: 'Total number of cache misses',
        labelNames: ['cache'],
      });

      // Database metrics
      this.createHistogram({
        name: `${this.config.prefix}db_query_duration_seconds`,
        help: 'Database query duration in seconds',
        labelNames: ['query', 'table'],
        buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      });

      // API metrics
      this.createHistogram({
        name: `${this.config.prefix}api_request_duration_seconds`,
        help: 'External API request duration in seconds',
        labelNames: ['api', 'endpoint', 'status'],
        buckets: [0.05, 0.1, 0.5, 1, 2, 5, 10],
      });

      // Business metrics
      this.createCounter({
        name: `${this.config.prefix}content_recommendations_total`,
        help: 'Total number of content recommendations generated',
        labelNames: ['type', 'status'],
      });

      this.createGauge({
        name: `${this.config.prefix}active_users`,
        help: 'Number of active users',
        labelNames: ['role'],
      });
    } catch (error) {
      this.logger.error('Failed to register application metrics', error.stack);
    }
  }

  /**
   * Creates a counter metric
   * @param options Counter options
   */
  createCounter(options: CounterOptions): void {
    if (!this.config.enabled) return;

    try {
      // Check if counter already exists
      if (this.counters.has(options.name)) {
        this.logger.debug(`Counter metric already exists: ${options.name}`);
        return;
      }

      // Check if metric already exists in registry
      const existingMetric = this.registry.getSingleMetric(options.name);
      if (existingMetric) {
        this.logger.debug(`Counter metric already registered: ${options.name}`);
        this.counters.set(options.name, existingMetric as Counter<string>);
        return;
      }

      const counter = new Counter({
        name: options.name,
        help: options.help,
        labelNames: options.labelNames || [],
        registers: [this.registry],
      });

      this.counters.set(options.name, counter);
      this.logger.debug(`Created counter metric: ${options.name}`);
    } catch (error) {
      if (error.message && error.message.includes('already registered')) {
        this.logger.debug(`Counter metric already registered: ${options.name}`);
        // Try to get the existing metric from the registry
        try {
          const existingMetric = this.registry.getSingleMetric(
            options.name,
          ) as Counter<string>;
          if (existingMetric) {
            this.counters.set(options.name, existingMetric);
          }
        } catch (innerError) {
          this.logger.debug(`Failed to get existing metric: ${options.name}`);
        }
      } else {
        this.logger.error(
          `Failed to create counter metric: ${options.name}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Increments a counter metric
   * @param name Metric name
   * @param value Value to increment by
   * @param labels Metric labels
   */
  incrementCounter(
    name: string,
    value = 1,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.config.enabled) return;

    const counter = this.counters.get(name);
    if (!counter) {
      this.logger.warn(`Counter metric not found: ${name}`);
      return;
    }

    try {
      counter.inc(labels || {}, value);
    } catch (error) {
      this.logger.error(
        `Failed to increment counter metric: ${name}`,
        error.stack,
      );
    }
  }

  /**
   * Creates a gauge metric
   * @param options Gauge options
   */
  createGauge(options: GaugeOptions): void {
    if (!this.config.enabled) return;

    try {
      // Check if gauge already exists
      if (this.gauges.has(options.name)) {
        this.logger.debug(`Gauge metric already exists: ${options.name}`);
        return;
      }

      // Check if metric already exists in registry
      const existingMetric = this.registry.getSingleMetric(options.name);
      if (existingMetric) {
        this.logger.debug(`Gauge metric already registered: ${options.name}`);
        this.gauges.set(options.name, existingMetric as Gauge<string>);
        return;
      }

      const gauge = new Gauge({
        name: options.name,
        help: options.help,
        labelNames: options.labelNames || [],
        registers: [this.registry],
      });

      this.gauges.set(options.name, gauge);
      this.logger.debug(`Created gauge metric: ${options.name}`);
    } catch (error) {
      if (error.message && error.message.includes('already registered')) {
        this.logger.debug(`Gauge metric already registered: ${options.name}`);
        // Try to get the existing metric from the registry
        try {
          const existingMetric = this.registry.getSingleMetric(
            options.name,
          ) as Gauge<string>;
          if (existingMetric) {
            this.gauges.set(options.name, existingMetric);
          }
        } catch (innerError) {
          this.logger.debug(`Failed to get existing metric: ${options.name}`);
        }
      } else {
        this.logger.error(
          `Failed to create gauge metric: ${options.name}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Sets a gauge metric value
   * @param name Metric name
   * @param value Value to set
   * @param labels Metric labels
   */
  setGauge(
    name: string,
    value: number,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.config.enabled) return;

    const gauge = this.gauges.get(name);
    if (!gauge) {
      this.logger.warn(`Gauge metric not found: ${name}`);
      return;
    }

    try {
      gauge.set(labels || {}, value);
    } catch (error) {
      this.logger.error(`Failed to set gauge metric: ${name}`, error.stack);
    }
  }

  /**
   * Increments a gauge metric
   * @param name Metric name
   * @param value Value to increment by
   * @param labels Metric labels
   */
  incrementGauge(
    name: string,
    value = 1,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.config.enabled) return;

    const gauge = this.gauges.get(name);
    if (!gauge) {
      this.logger.warn(`Gauge metric not found: ${name}`);
      return;
    }

    try {
      gauge.inc(labels || {}, value);
    } catch (error) {
      this.logger.error(
        `Failed to increment gauge metric: ${name}`,
        error.stack,
      );
    }
  }

  /**
   * Decrements a gauge metric
   * @param name Metric name
   * @param value Value to decrement by
   * @param labels Metric labels
   */
  decrementGauge(
    name: string,
    value = 1,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.config.enabled) return;

    const gauge = this.gauges.get(name);
    if (!gauge) {
      this.logger.warn(`Gauge metric not found: ${name}`);
      return;
    }

    try {
      gauge.dec(labels || {}, value);
    } catch (error) {
      this.logger.error(
        `Failed to decrement gauge metric: ${name}`,
        error.stack,
      );
    }
  }

  /**
   * Creates a histogram metric
   * @param options Histogram options
   */
  createHistogram(options: HistogramOptions): void {
    if (!this.config.enabled) return;

    try {
      // Check if histogram already exists
      if (this.histograms.has(options.name)) {
        this.logger.debug(`Histogram metric already exists: ${options.name}`);
        return;
      }

      // Check if metric already exists in registry
      const existingMetric = this.registry.getSingleMetric(options.name);
      if (existingMetric) {
        this.logger.debug(
          `Histogram metric already registered: ${options.name}`,
        );
        this.histograms.set(options.name, existingMetric as Histogram<string>);
        return;
      }

      const histogram = new Histogram({
        name: options.name,
        help: options.help,
        labelNames: options.labelNames || [],
        buckets: options.buckets || [0.1, 0.5, 1, 2, 5],
        registers: [this.registry],
      });

      this.histograms.set(options.name, histogram);
      this.logger.debug(`Created histogram metric: ${options.name}`);
    } catch (error) {
      if (error.message && error.message.includes('already registered')) {
        this.logger.debug(
          `Histogram metric already registered: ${options.name}`,
        );
        // Try to get the existing metric from the registry
        try {
          const existingMetric = this.registry.getSingleMetric(
            options.name,
          ) as Histogram<string>;
          if (existingMetric) {
            this.histograms.set(options.name, existingMetric);
          }
        } catch (innerError) {
          this.logger.debug(`Failed to get existing metric: ${options.name}`);
        }
      } else {
        this.logger.error(
          `Failed to create histogram metric: ${options.name}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Observes a histogram metric value
   * @param name Metric name
   * @param value Value to observe
   * @param labels Metric labels
   */
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.config.enabled) return;

    const histogram = this.histograms.get(name);
    if (!histogram) {
      this.logger.warn(`Histogram metric not found: ${name}`);
      return;
    }

    try {
      histogram.observe(labels || {}, value);
    } catch (error) {
      this.logger.error(
        `Failed to observe histogram metric: ${name}`,
        error.stack,
      );
    }
  }

  /**
   * Creates a summary metric
   * @param options Summary options
   */
  createSummary(options: SummaryOptions): void {
    if (!this.config.enabled) return;

    try {
      // Check if summary already exists
      if (this.summaries.has(options.name)) {
        this.logger.debug(`Summary metric already exists: ${options.name}`);
        return;
      }

      // Check if metric already exists in registry
      const existingMetric = this.registry.getSingleMetric(options.name);
      if (existingMetric) {
        this.logger.debug(`Summary metric already registered: ${options.name}`);
        this.summaries.set(options.name, existingMetric as Summary<string>);
        return;
      }

      const summary = new Summary({
        name: options.name,
        help: options.help,
        labelNames: options.labelNames || [],
        percentiles: options.percentiles || [
          0.01, 0.05, 0.5, 0.9, 0.95, 0.99, 0.999,
        ],
        registers: [this.registry],
      });

      this.summaries.set(options.name, summary);
      this.logger.debug(`Created summary metric: ${options.name}`);
    } catch (error) {
      if (error.message && error.message.includes('already registered')) {
        this.logger.debug(`Summary metric already registered: ${options.name}`);
        // Try to get the existing metric from the registry
        try {
          const existingMetric = this.registry.getSingleMetric(
            options.name,
          ) as Summary<string>;
          if (existingMetric) {
            this.summaries.set(options.name, existingMetric);
          }
        } catch (innerError) {
          this.logger.debug(`Failed to get existing metric: ${options.name}`);
        }
      } else {
        this.logger.error(
          `Failed to create summary metric: ${options.name}`,
          error.stack,
        );
      }
    }
  }

  /**
   * Observes a summary metric value
   * @param name Metric name
   * @param value Value to observe
   * @param labels Metric labels
   */
  observeSummary(
    name: string,
    value: number,
    labels?: Record<string, string | number>,
  ): void {
    if (!this.initialized) {
      this.logger.warn(
        `Cannot observe summary ${name} - metrics not initialized`,
      );
      return;
    }

    const summary = this.summaries.get(name);
    if (!summary) {
      this.logger.warn(`Summary ${name} not found`);
      return;
    }

    try {
      if (labels) {
        summary.observe(labels, value);
      } else {
        summary.observe(value);
      }
    } catch (error) {
      this.logger.error(`Error observing summary ${name}`, error);
    }
  }

  /**
   * Starts a timer for a histogram or summary metric
   * @param name Metric name
   * @param labels Metric labels
   * @returns Function to stop the timer and observe the duration
   */
  startTimer(
    name: string,
    labels?: Record<string, string | number>,
  ): () => number {
    if (!this.config.enabled) {
      return () => 0;
    }

    const histogram = this.histograms.get(name);
    if (histogram) {
      return histogram.startTimer(labels || {});
    }

    const summary = this.summaries.get(name);
    if (summary) {
      return summary.startTimer(labels || {});
    }

    this.logger.warn(`Metric not found for timer: ${name}`);
    return () => 0;
  }

  /**
   * Removes a metric
   * @param name Metric name
   */
  removeMetric(name: string): void {
    if (!this.config.enabled) return;

    try {
      this.registry.removeSingleMetric(name);
      this.counters.delete(name);
      this.gauges.delete(name);
      this.histograms.delete(name);
      this.summaries.delete(name);
      this.logger.debug(`Removed metric: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to remove metric: ${name}`, error.stack);
    }
  }

  /**
   * Removes all metrics
   */
  resetMetrics(): void {
    if (!this.config.enabled) return;

    try {
      this.registry.clear();
      this.counters.clear();
      this.gauges.clear();
      this.histograms.clear();
      this.summaries.clear();
      this.logger.debug('Reset all metrics');
    } catch (error) {
      this.logger.error('Failed to reset metrics', error.stack);
    }
  }

  /**
   * Gets all metrics in Prometheus format
   * @returns Metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    try {
      return await this.registry.metrics();
    } catch (error) {
      this.logger.error('Failed to get metrics', error.stack);
      return '';
    }
  }
}
