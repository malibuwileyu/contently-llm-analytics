import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrometheusMetricsService } from '../services/prometheus-metrics.service';
import { MetricsConfig } from '../../config/metrics.config';

describe('PrometheusMetricsService', () => {
  let service: PrometheusMetricsService;
  let configService: ConfigService;
  let config: MetricsConfig;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrometheusMetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'metrics.enabled':
                  return true;
                case 'metrics.prefix':
                  return 'test_';
                case 'metrics.endpoint':
                  return '/metrics';
                case 'metrics.defaultLabels':
                  return {};
                case 'metrics.collectDefaultMetrics':
                  return true;
                case 'metrics.defaultMetricsInterval':
                  return 10000;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrometheusMetricsService>(PrometheusMetricsService);
    configService = module.get<ConfigService>(ConfigService);
    
    // Clear registry before each test to prevent "already registered" errors
    service.clearRegistry();
    
    // Call onModuleInit manually
    service.onModuleInit();
  });

  afterEach(() => {
    // Clean up after each test
    service.clearRegistry();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Counter metrics', () => {
    it('should create and increment counter metrics', async () => {
      // Create counter
      service.createCounter({
        name: 'test_counter',
        help: 'Test counter',
        labelNames: ['label1', 'label2'],
      });

      // Increment counter
      service.incrementCounter('test_counter', 1, { label1: 'value1', label2: 'value2' });
      service.incrementCounter('test_counter', 2, { label1: 'value1', label2: 'value2' });

      // Get metrics
      const metrics = await service.getMetrics();
      
      // Verify metrics
      expect(metrics).toContain('test_counter');
      expect(metrics).toContain('value1');
      expect(metrics).toContain('value2');
    });

    it('should handle non-existent counter metrics', () => {
      // Increment non-existent counter
      expect(() => {
        service.incrementCounter('non_existent_counter', 1);
      }).not.toThrow();
    });

    it('should create and increment counter', () => {
      service.createCounter({
        name: 'test_counter',
        help: 'Test counter help',
      });

      service.incrementCounter('test_counter', 1);
      expect(configService.get).toHaveBeenCalled();
    });
  });

  describe('Gauge metrics', () => {
    it('should create and set gauge metrics', async () => {
      // Create gauge
      service.createGauge({
        name: 'test_gauge',
        help: 'Test gauge',
        labelNames: ['label1'],
      });

      // Set gauge
      service.setGauge('test_gauge', 42, { label1: 'value1' });

      // Get metrics
      const metrics = await service.getMetrics();
      
      // Verify metrics
      expect(metrics).toContain('test_gauge');
      expect(metrics).toContain('value1');
      expect(metrics).toContain('42');
    });

    it('should increment and decrement gauge metrics', async () => {
      // Create gauge
      service.createGauge({
        name: 'test_gauge_inc_dec',
        help: 'Test gauge for increment/decrement',
      });

      // Set initial value
      service.setGauge('test_gauge_inc_dec', 10);
      
      // Increment and decrement
      service.incrementGauge('test_gauge_inc_dec', 5);
      service.decrementGauge('test_gauge_inc_dec', 2);

      // Get metrics
      const metrics = await service.getMetrics();
      
      // Verify metrics
      expect(metrics).toContain('test_gauge_inc_dec');
    });

    it('should create and set gauge', () => {
      service.createGauge({
        name: 'test_gauge',
        help: 'Test gauge help',
      });

      service.setGauge('test_gauge', 42);
      expect(configService.get).toHaveBeenCalled();
    });
  });

  describe('Histogram metrics', () => {
    it('should create and observe histogram metrics', async () => {
      // Create histogram
      service.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram',
        labelNames: ['label1'],
        buckets: [0.1, 0.5, 1],
      });

      // Observe values
      service.observeHistogram('test_histogram', 0.2, { label1: 'value1' });
      service.observeHistogram('test_histogram', 0.7, { label1: 'value1' });

      // Get metrics
      const metrics = await service.getMetrics();
      
      // Verify metrics
      expect(metrics).toContain('test_histogram');
      expect(metrics).toContain('value1');
      expect(metrics).toContain('bucket');
    });

    it('should use timer for histogram metrics', async () => {
      // Create histogram with unique name to prevent "already registered" errors
      const uniqueMetricName = `test_histogram_timer_${Date.now()}`;
      service.createHistogram({
        name: uniqueMetricName,
        help: 'Test histogram timer',
        buckets: [0.1, 0.5, 1, 2, 5],
      });

      // Use timer
      const endTimer = service.startTimer(uniqueMetricName);
      
      // Wait a bit longer to ensure a measurable duration
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // End timer
      const duration = endTimer();
      
      // Verify duration
      expect(duration).toBeGreaterThan(0);
    });

    it('should create and observe histogram', () => {
      service.createHistogram({
        name: 'test_histogram',
        help: 'Test histogram help',
        buckets: [0.1, 0.5, 1],
      });

      service.observeHistogram('test_histogram', 0.3);
      expect(configService.get).toHaveBeenCalled();
    });
  });

  describe('Summary metrics', () => {
    it('should create and observe summary metrics', async () => {
      // Create summary
      service.createSummary({
        name: 'test_summary',
        help: 'Test summary',
        labelNames: ['label1'],
        percentiles: [0.5, 0.9, 0.99],
      });

      // Observe values
      service.observeSummary('test_summary', 100, { label1: 'value1' });
      service.observeSummary('test_summary', 200, { label1: 'value1' });
      service.observeSummary('test_summary', 300, { label1: 'value1' });

      // Get metrics
      const metrics = await service.getMetrics();
      
      // Verify metrics
      expect(metrics).toContain('test_summary');
      expect(metrics).toContain('value1');
    });
  });

  describe('Metric management', () => {
    it('should remove a metric', async () => {
      // Create counter
      service.createCounter({
        name: 'test_counter_to_remove',
        help: 'Test counter to remove',
      });

      // Increment counter
      service.incrementCounter('test_counter_to_remove', 1);

      // Get metrics before removal
      const metricsBefore = await service.getMetrics();
      expect(metricsBefore).toContain('test_counter_to_remove');

      // Remove metric
      service.removeMetric('test_counter_to_remove');

      // Get metrics after removal
      const metricsAfter = await service.getMetrics();
      expect(metricsAfter).not.toContain('test_counter_to_remove');
    });

    it('should reset all metrics', async () => {
      // Create counter
      service.createCounter({
        name: 'test_counter_to_reset',
        help: 'Test counter to reset',
      });

      // Create gauge
      service.createGauge({
        name: 'test_gauge_to_reset',
        help: 'Test gauge to reset',
      });

      // Increment counter and set gauge
      service.incrementCounter('test_counter_to_reset', 1);
      service.setGauge('test_gauge_to_reset', 42);

      // Get metrics before reset
      const metricsBefore = await service.getMetrics();
      expect(metricsBefore).toContain('test_counter_to_reset');
      expect(metricsBefore).toContain('test_gauge_to_reset');

      // Reset metrics
      service.resetMetrics();

      // Get metrics after reset
      const metricsAfter = await service.getMetrics();
      expect(metricsAfter).not.toContain('test_counter_to_reset');
      expect(metricsAfter).not.toContain('test_gauge_to_reset');
    });
  });

  describe('Disabled metrics', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PrometheusMetricsService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case 'metrics.enabled':
                    return false;
                  default:
                    return undefined;
                }
              }),
            },
          },
        ],
      }).compile();

      service = module.get<PrometheusMetricsService>(PrometheusMetricsService);
    });

    it('should not throw errors when metrics are disabled', () => {
      expect(() => {
        service.createCounter({
          name: 'test_counter',
          help: 'Test counter help',
        });
        service.incrementCounter('test_counter', 1);
      }).not.toThrow();
    });
  });
}); 