import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { PrometheusMetricsService } from './prometheus-metrics.service';
import { MetricsConfig } from '../../config/metrics.config';

export interface BusinessMetrics {
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
  averageResponseTime: number;
}

/**
 * Service for tracking business metrics
 */
@Injectable()
export class BusinessMetricsService implements OnModuleInit {
  private readonly logger = new Logger(BusinessMetricsService.name);

  constructor(
    private readonly metricsService: PrometheusMetricsService,
    @Inject('METRICS_CONFIG') private readonly config: MetricsConfig,
  ) {}

  /**
   * Initialize the business metrics service
   */
  onModuleInit(): void {
    if (!this.config.enabled) {
      this.logger.log('Business metrics service is disabled');
      return;
    }

    this.logger.log('Initializing business metrics service');
    this.setupBusinessMetrics();
  }

  /**
   * Sets up business metrics
   */
  private setupBusinessMetrics(): void {
    // Content recommendation metrics
    this.metricsService.createCounter({
      name: `${this.config.prefix}content_recommendations_total`,
      help: 'Total number of content recommendations generated',
      labelNames: ['type', 'status'],
    });

    this.metricsService.createHistogram({
      name: `${this.config.prefix}content_recommendation_generation_seconds`,
      help: 'Content recommendation generation time in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.metricsService.createGauge({
      name: `${this.config.prefix}content_recommendation_quality`,
      help: 'Content recommendation quality score (0-1)',
      labelNames: ['type'],
    });

    // User activity metrics
    this.metricsService.createCounter({
      name: `${this.config.prefix}user_logins_total`,
      help: 'Total number of user logins',
      labelNames: ['role', 'status'],
    });

    this.metricsService.createGauge({
      name: `${this.config.prefix}active_users`,
      help: 'Number of active users',
      labelNames: ['role'],
    });

    this.metricsService.createHistogram({
      name: `${this.config.prefix}user_session_duration_seconds`,
      help: 'User session duration in seconds',
      labelNames: ['role'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
    });

    // Content creation metrics
    this.metricsService.createCounter({
      name: `${this.config.prefix}content_created_total`,
      help: 'Total number of content items created',
      labelNames: ['type', 'status'],
    });

    this.metricsService.createHistogram({
      name: `${this.config.prefix}content_creation_seconds`,
      help: 'Content creation time in seconds',
      labelNames: ['type'],
      buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
    });

    // API usage metrics
    this.metricsService.createCounter({
      name: `${this.config.prefix}api_calls_total`,
      help: 'Total number of API calls',
      labelNames: ['endpoint', 'status'],
    });

    this.metricsService.createHistogram({
      name: `${this.config.prefix}api_response_size_bytes`,
      help: 'API response size in bytes',
      labelNames: ['endpoint'],
      buckets: [1000, 10000, 100000, 1000000, 10000000],
    });
  }

  /**
   * Tracks a content recommendation
   * @param type Recommendation type
   * @param status Recommendation status
   */
  trackContentRecommendation(type: string, status: string): void {
    if (!this.config.enabled) return;

    this.metricsService.incrementCounter(
      `${this.config.prefix}content_recommendations_total`,
      1,
      { type, status },
    );
  }

  /**
   * Tracks content recommendation generation time
   * @param type Recommendation type
   * @param durationSeconds Duration in seconds
   */
  trackContentRecommendationTime(type: string, durationSeconds: number): void {
    if (!this.config.enabled) return;

    this.metricsService.observeHistogram(
      `${this.config.prefix}content_recommendation_generation_seconds`,
      durationSeconds,
      { type },
    );
  }

  /**
   * Sets content recommendation quality
   * @param type Recommendation type
   * @param quality Quality score (0-1)
   */
  setContentRecommendationQuality(type: string, quality: number): void {
    if (!this.config.enabled) return;

    this.metricsService.setGauge(
      `${this.config.prefix}content_recommendation_quality`,
      quality,
      { type },
    );
  }

  /**
   * Tracks a user login
   * @param role User role
   * @param status Login status
   */
  trackUserLogin(role: string, status: string): void {
    if (!this.config.enabled) return;

    this.metricsService.incrementCounter(
      `${this.config.prefix}user_logins_total`,
      1,
      { role, status },
    );
  }

  /**
   * Sets the number of active users
   * @param role User role
   * @param count Number of active users
   */
  setActiveUsers(role: string, count: number): void {
    if (!this.config.enabled) return;

    this.metricsService.setGauge(`${this.config.prefix}active_users`, count, {
      role,
    });
  }

  /**
   * Tracks a user session duration
   * @param role User role
   * @param durationSeconds Duration in seconds
   */
  trackUserSessionDuration(role: string, durationSeconds: number): void {
    if (!this.config.enabled) return;

    this.metricsService.observeHistogram(
      `${this.config.prefix}user_session_duration_seconds`,
      durationSeconds,
      { role },
    );
  }

  /**
   * Tracks content creation
   * @param type Content type
   * @param status Content status
   */
  trackContentCreation(type: string, status: string): void {
    if (!this.config.enabled) return;

    this.metricsService.incrementCounter(
      `${this.config.prefix}content_created_total`,
      1,
      { type, status },
    );
  }

  /**
   * Tracks content creation time
   * @param type Content type
   * @param durationSeconds Duration in seconds
   */
  trackContentCreationTime(type: string, durationSeconds: number): void {
    if (!this.config.enabled) return;

    this.metricsService.observeHistogram(
      `${this.config.prefix}content_creation_seconds`,
      durationSeconds,
      { type },
    );
  }

  /**
   * Tracks an API call
   * @param endpoint API endpoint
   * @param status Response status
   */
  trackApiCall(endpoint: string, status: string): void {
    if (!this.config.enabled) return;

    this.metricsService.incrementCounter(
      `${this.config.prefix}api_calls_total`,
      1,
      { endpoint, status },
    );
  }

  /**
   * Tracks API response size
   * @param endpoint API endpoint
   * @param sizeBytes Response size in bytes
   */
  trackApiResponseSize(endpoint: string, sizeBytes: number): void {
    if (!this.config.enabled) return;

    this.metricsService.observeHistogram(
      `${this.config.prefix}api_response_size_bytes`,
      sizeBytes,
      { endpoint },
    );
  }

  async recordUserActivity(userId: string, action: string): Promise<void> {
    this.metricsService.incrementCounter('user_activity_total', {
      user_id: userId,
      action,
    });
  }

  async recordFeatureUsage(featureId: string, userId: string): Promise<void> {
    this.metricsService.incrementCounter('feature_usage_total', {
      feature_id: featureId,
      user_id: userId,
    });
  }

  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const metrics = await this.metricsService.getMetrics();

    return {
      activeUsers: metrics.activeUsers || 0,
      totalRequests: metrics.totalRequests || 0,
      errorRate: metrics.errorRate || 0,
      averageResponseTime: metrics.averageResponseTime || 0,
    };
  }
}
