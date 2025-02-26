/**
 * Metric types supported by the metrics service
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

/**
 * Base metric options
 */
export interface MetricOptions {
  /** Metric name */
  name: string;
  
  /** Metric help text */
  help: string;
  
  /** Metric labels */
  labelNames?: string[];
}

/**
 * Counter metric options
 */
export interface CounterOptions extends MetricOptions {}

/**
 * Gauge metric options
 */
export interface GaugeOptions extends MetricOptions {}

/**
 * Histogram metric options
 */
export interface HistogramOptions extends MetricOptions {
  /** Bucket boundaries */
  buckets?: number[];
}

/**
 * Summary metric options
 */
export interface SummaryOptions extends MetricOptions {
  /** Percentiles to calculate */
  percentiles?: number[];
  
  /** Maximum age (in seconds) of observations */
  maxAgeSeconds?: number;
  
  /** Number of observations to keep */
  ageBuckets?: number;
}

/**
 * Metric value with labels
 */
export interface MetricValue {
  /** Metric value */
  value: number;
  
  /** Metric labels */
  labels?: Record<string, string | number>;
}

/**
 * Metrics service interface
 */
export interface MetricsService {
  /**
   * Creates a counter metric
   * @param options Counter options
   */
  createCounter(options: CounterOptions): void;
  
  /**
   * Increments a counter metric
   * @param name Metric name
   * @param value Value to increment by
   * @param labels Metric labels
   */
  incrementCounter(name: string, value?: number, labels?: Record<string, string | number>): void;
  
  /**
   * Creates a gauge metric
   * @param options Gauge options
   */
  createGauge(options: GaugeOptions): void;
  
  /**
   * Sets a gauge metric value
   * @param name Metric name
   * @param value Value to set
   * @param labels Metric labels
   */
  setGauge(name: string, value: number, labels?: Record<string, string | number>): void;
  
  /**
   * Increments a gauge metric
   * @param name Metric name
   * @param value Value to increment by
   * @param labels Metric labels
   */
  incrementGauge(name: string, value?: number, labels?: Record<string, string | number>): void;
  
  /**
   * Decrements a gauge metric
   * @param name Metric name
   * @param value Value to decrement by
   * @param labels Metric labels
   */
  decrementGauge(name: string, value?: number, labels?: Record<string, string | number>): void;
  
  /**
   * Creates a histogram metric
   * @param options Histogram options
   */
  createHistogram(options: HistogramOptions): void;
  
  /**
   * Observes a histogram metric value
   * @param name Metric name
   * @param value Value to observe
   * @param labels Metric labels
   */
  observeHistogram(name: string, value: number, labels?: Record<string, string | number>): void;
  
  /**
   * Creates a summary metric
   * @param options Summary options
   */
  createSummary(options: SummaryOptions): void;
  
  /**
   * Observes a summary metric value
   * @param name Metric name
   * @param value Value to observe
   * @param labels Metric labels
   */
  observeSummary(name: string, value: number, labels?: Record<string, string | number>): void;
  
  /**
   * Starts a timer for a histogram or summary metric
   * @param name Metric name
   * @param labels Metric labels
   * @returns Function to stop the timer and observe the duration
   */
  startTimer(name: string, labels?: Record<string, string | number>): () => number;
  
  /**
   * Removes a metric
   * @param name Metric name
   */
  removeMetric(name: string): void;
  
  /**
   * Removes all metrics
   */
  resetMetrics(): void;
  
  /**
   * Gets all metrics in Prometheus format
   * @returns Metrics in Prometheus format
   */
  getMetrics(): Promise<string>;
} 