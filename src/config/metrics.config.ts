/**
 * Configuration for the metrics collection service
 */
export interface MetricsConfig {
  /** Whether to enable metrics collection */
  enabled: boolean;

  /** Default labels to apply to all metrics */
  defaultLabels: Record<string, string>;

  /** Prefix for all metric names */
  prefix: string;

  /** Endpoint for exposing Prometheus metrics */
  endpoint: string;

  /** Whether to collect default metrics */
  collectDefaultMetrics: boolean;

  /** Default metrics collection interval in milliseconds */
  defaultMetricsInterval: number;
}

/**
 * Default metrics configuration
 */
export const defaultMetricsConfig: MetricsConfig = {
  enabled: process.env.METRICS_ENABLED === 'true',
  defaultLabels: {
    app: 'contently-llm-analytics',
    environment: process.env.NODE_ENV || 'development',
  },
  prefix: 'contently_',
  endpoint: '/metrics',
  collectDefaultMetrics: true,
  defaultMetricsInterval: 10000, // 10 seconds
};

/**
 * Creates metrics configuration from environment variables
 */
export const createMetricsConfig = (): MetricsConfig => {
  return {
    ...defaultMetricsConfig,
    enabled: process.env.METRICS_ENABLED === 'true',
    defaultLabels: {
      ...defaultMetricsConfig.defaultLabels,
      environment: process.env.NODE_ENV || 'development',
      _version: process.env.APP_VERSION || 'unknown',
    },
    prefix: process.env.METRICS_PREFIX || defaultMetricsConfig.prefix,
    endpoint: process.env.METRICS_ENDPOINT || defaultMetricsConfig.endpoint,
    collectDefaultMetrics:
      process.env.METRICS_COLLECT_DEFAULT === 'true' ||
      defaultMetricsConfig.collectDefaultMetrics,
    defaultMetricsInterval: parseInt(
      process.env.METRICS_DEFAULT_INTERVAL ||
        String(defaultMetricsConfig.defaultMetricsInterval),
      10,
    ),
  };
};
