import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { Connection, QueryRunner } from 'typeorm';
import { PrometheusMetricsService } from './prometheus-metrics.service';
import { MetricsConfig } from '../../config/metrics.config';

export interface DatabaseMetrics {
  activeConnections: number;
  queryCount: number;
  averageQueryTime: number;
  errorCount: number;
}

/**
 * Service for tracking database query metrics
 */
@Injectable()
export class DatabaseMetricsService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseMetricsService.name);
  private readonly queryMetricName: string;

  constructor(
    private readonly connection: Connection,
    private readonly metricsService: PrometheusMetricsService,
    @Inject('METRICS_CONFIG') private readonly config: MetricsConfig,
  ) {
    this.queryMetricName = `${this.config.prefix}db_query_duration_seconds`;
  }

  /**
   * Initialize the database metrics service
   */
  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.log('Database metrics service is disabled');
      return;
    }

    this.logger.log('Initializing database metrics service');
    this.setupQueryMetrics();
  }

  /**
   * Sets up query metrics tracking
   */
  private setupQueryMetrics(): void {
    // Create histogram for query duration
    this.metricsService.createHistogram({
      name: this.queryMetricName,
      help: 'Database query duration in seconds',
      labelNames: ['query', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    });

    // Create counter for query errors
    this.metricsService.createCounter({
      name: `${this.config.prefix}db_query_errors_total`,
      help: 'Total number of database query errors',
      labelNames: ['query', 'table', 'error'],
    });

    // Create gauge for connection pool
    this.metricsService.createGauge({
      name: `${this.config.prefix}db_connections_active`,
      help: 'Number of active database connections',
    });

    // Schedule connection pool metrics collection
    setInterval(() => this.collectConnectionMetrics(), 30000); // Every 30 seconds
  }

  /**
   * Collects connection pool metrics
   */
  private async collectConnectionMetrics(): Promise<void> {
    if (!this.config.enabled) return;

    try {
      const queryRunner = this.connection.createQueryRunner();
      await queryRunner.connect();

      // Get connection pool stats
      const poolStats = await this.getConnectionPoolStats(queryRunner);

      // Update gauge with active connections
      this.metricsService.setGauge(
        `${this.config.prefix}db_connections_active`,
        poolStats.active,
      );

      await queryRunner.release();
    } catch (error) {
      this.logger.error('Failed to collect connection metrics', error.stack);
    }
  }

  /**
   * Gets connection pool stats
   * @param queryRunner Query runner
   * @returns Connection pool stats
   */
  private async getConnectionPoolStats(queryRunner: QueryRunner): Promise<{
    active: number;
    idle: number;
    total: number;
  }> {
    try {
      // This query is PostgreSQL-specific
      const result = await queryRunner.query(
        `SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'`,
      );

      return {
        active: parseInt(result[0]?.active || '0', 10),
        idle: 0, // Not available in this simple query
        total: 0, // Not available in this simple query
      };
    } catch (error) {
      this.logger.error('Failed to get connection pool stats', error.stack);
      return { active: 0, idle: 0, total: 0 };
    }
  }

  /**
   * Tracks a database query
   * @param query Query string
   * @param table Table name
   * @param callback Query callback
   * @returns Query result
   */
  async trackQuery<T>(
    query: string,
    table: string,
    callback: () => Promise<T>,
  ): Promise<T> {
    if (!this.config.enabled) {
      return callback();
    }

    // Extract query type (SELECT, INSERT, etc.)
    const queryType = this.getQueryType(query);

    // Start timer
    const endTimer = this.metricsService.startTimer(this.queryMetricName, {
      query: queryType,
      table,
    });

    try {
      // Execute query
      const result = await callback();

      // End timer
      endTimer();

      return result;
    } catch (error) {
      // End timer
      endTimer();

      // Increment error counter
      this.metricsService.incrementCounter(
        `${this.config.prefix}db_query_errors_total`,
        1,
        {
          query: queryType,
          table,
          error: error.code || 'unknown',
        },
      );

      throw error;
    }
  }

  /**
   * Gets the query type from a query string
   * @param query Query string
   * @returns Query type
   */
  private getQueryType(query: string): string {
    const normalizedQuery = query.trim().toUpperCase();

    if (normalizedQuery.startsWith('SELECT')) return 'SELECT';
    if (normalizedQuery.startsWith('INSERT')) return 'INSERT';
    if (normalizedQuery.startsWith('UPDATE')) return 'UPDATE';
    if (normalizedQuery.startsWith('DELETE')) return 'DELETE';
    if (normalizedQuery.startsWith('CREATE')) return 'CREATE';
    if (normalizedQuery.startsWith('ALTER')) return 'ALTER';
    if (normalizedQuery.startsWith('DROP')) return 'DROP';

    return 'OTHER';
  }
}
