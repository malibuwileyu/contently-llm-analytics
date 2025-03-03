import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  In,
} from 'typeorm';
import { Answer } from '../entities/answer.entity';
import { AnswerScore, ScoreMetricType } from '../entities/answer-score.entity';
import { AnswerValidation } from '../entities/answer-validation.entity';
import { AnswerMetadata } from '../entities/answer-metadata.entity';

/**
 * Types of analytics aggregation periods
 */
export enum AggregationPeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Analytics aggregation filters
 */
export interface AnalyticsFilter {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  queryIds?: string[];
  categories?: string[];
}

/**
 * Answer quality metrics
 */
export interface AnswerQualityMetrics {
  averageOverallScore: number;
  averageRelevanceScore: number;
  averageAccuracyScore: number;
  averageCompletenessScore: number;
  averageHelpfulnessScore: number;
  validationPassRate: number;
  rejectionRate: number;
}

/**
 * Answer performance metrics
 */
export interface AnswerPerformanceMetrics {
  totalAnswersGenerated: number;
  averageGenerationTime: number;
  averageTokenUsage: number;
  successRate: number;
  failureRate: number;
}

/**
 * Answer trend data
 */
export interface AnswerTrendData {
  period: string;
  metrics: {
    answersGenerated: number;
    validationPassRate: number;
    averageScore: number;
  };
}

/**
 * Answer analytics report
 */
export interface AnswerAnalyticsReport {
  qualityMetrics: AnswerQualityMetrics;
  performanceMetrics: AnswerPerformanceMetrics;
  trends: AnswerTrendData[];
  topCategories: { category: string; count: number }[];
  statusDistribution: { status: string; count: number }[];
}

/**
 * Service responsible for aggregating answer data for analytics
 */
@Injectable()
export class AnswerAnalyticsService {
  private readonly logger = new Logger(AnswerAnalyticsService.name);

  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
    @InjectRepository(AnswerScore)
    private readonly scoreRepository: Repository<AnswerScore>,
    @InjectRepository(AnswerValidation)
    private readonly validationRepository: Repository<AnswerValidation>,
    @InjectRepository(AnswerMetadata)
    private readonly metadataRepository: Repository<AnswerMetadata>,
  ) {}

  /**
   * Generate a comprehensive analytics report for answers
   *
   * @param filter - Analytics filter parameters
   * @returns Analytics report
   */
  async generateReport(
    filter: AnalyticsFilter = {},
  ): Promise<AnswerAnalyticsReport> {
    this.logger.log(
      `Generating answer analytics report with filters: ${JSON.stringify(filter)}`,
    );

    const qualityMetrics = await this.calculateQualityMetrics(filter);
    const performanceMetrics = await this.calculatePerformanceMetrics(filter);
    const trends = await this.calculateTrends(filter);
    const topCategories = await this.getTopCategories(filter);
    const statusDistribution = await this.getStatusDistribution(filter);

    return {
      qualityMetrics,
      performanceMetrics,
      trends,
      topCategories,
      statusDistribution,
    };
  }

  /**
   * Calculate quality metrics for answers
   *
   * @param filter - Analytics filter parameters
   * @returns Quality metrics
   */
  async calculateQualityMetrics(
    filter: AnalyticsFilter = {},
  ): Promise<AnswerQualityMetrics> {
    const dateFilter = this.buildDateFilter(filter);

    // Get all scores for the filtered answers
    const scores = await this.scoreRepository
      .createQueryBuilder('score')
      .innerJoin('score.answer', 'answer')
      .where(dateFilter ? `answer.createdAt ${dateFilter}` : '1=1')
      .getMany();

    // Get all validations for the filtered answers
    const validations = await this.validationRepository
      .createQueryBuilder('validation')
      .innerJoin('validation.answer', 'answer')
      .where(dateFilter ? `answer.createdAt ${dateFilter}` : '1=1')
      .getMany();

    // Get total answers count
    const totalAnswers = await this.answerRepository.count({
      where: this.buildWhereClause(filter),
    });

    // Calculate average scores
    const relevanceScores = scores
      .filter(s => s.metricType === ScoreMetricType.RELEVANCE)
      .map(s => s.score);
    const accuracyScores = scores
      .filter(s => s.metricType === ScoreMetricType.ACCURACY)
      .map(s => s.score);
    const completenessScores = scores
      .filter(s => s.metricType === ScoreMetricType.COMPLETENESS)
      .map(s => s.score);
    const helpfulnessScores = scores
      .filter(s => s.metricType === ScoreMetricType.HELPFULNESS)
      .map(s => s.score);
    const overallScores = scores
      .filter(s => s.metricType === ScoreMetricType.OVERALL)
      .map(s => s.score);

    // Calculate validation rates
    const passedValidations = validations.filter(
      v => v.status === 'passed',
    ).length;
    const rejectedAnswers = await this.answerRepository.count({
      where: {
        ...this.buildWhereClause(filter),
        status: 'rejected',
      },
    });

    return {
      averageOverallScore: this.calculateAverage(overallScores),
      averageRelevanceScore: this.calculateAverage(relevanceScores),
      averageAccuracyScore: this.calculateAverage(accuracyScores),
      averageCompletenessScore: this.calculateAverage(completenessScores),
      averageHelpfulnessScore: this.calculateAverage(helpfulnessScores),
      validationPassRate:
        totalAnswers > 0 ? passedValidations / (validations.length || 1) : 0,
      rejectionRate: totalAnswers > 0 ? rejectedAnswers / totalAnswers : 0,
    };
  }

  /**
   * Calculate performance metrics for answers
   *
   * @param filter - Analytics filter parameters
   * @returns Performance metrics
   */
  async calculatePerformanceMetrics(
    filter: AnalyticsFilter = {},
  ): Promise<AnswerPerformanceMetrics> {
    const answers = await this.answerRepository.find({
      where: this.buildWhereClause(filter),
      relations: ['metadata'],
    });

    const totalAnswers = answers.length;
    const successfulAnswers = answers.filter(
      a => a.status === 'validated',
    ).length;
    const failedAnswers = answers.filter(a =>
      ['rejected', 'failed'].includes(a.status),
    ).length;

    // Extract generation times and token usage from metadata
    const generationTimes: number[] = [];
    const tokenUsages: number[] = [];

    answers.forEach(answer => {
      const generationTimeMetadata = answer.metadata?.find(
        m => m.key === 'generationTimeMs',
      );
      const tokenUsageMetadata = answer.metadata?.find(
        m => m.key === 'tokenUsage',
      );

      if (generationTimeMetadata && generationTimeMetadata.numericValue) {
        generationTimes.push(generationTimeMetadata.numericValue);
      }

      if (tokenUsageMetadata && tokenUsageMetadata.numericValue) {
        tokenUsages.push(tokenUsageMetadata.numericValue);
      }
    });

    return {
      totalAnswersGenerated: totalAnswers,
      averageGenerationTime: this.calculateAverage(generationTimes),
      averageTokenUsage: this.calculateAverage(tokenUsages),
      successRate: totalAnswers > 0 ? successfulAnswers / totalAnswers : 0,
      failureRate: totalAnswers > 0 ? failedAnswers / totalAnswers : 0,
    };
  }

  /**
   * Calculate trend data for answers over time
   *
   * @param filter - Analytics filter parameters
   * @param period - Aggregation period
   * @returns Trend data
   */
  async calculateTrends(
    filter: AnalyticsFilter = {},
    period: AggregationPeriod = AggregationPeriod.WEEK,
  ): Promise<AnswerTrendData[]> {
    const startDate =
      filter.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default to last 90 days
    const endDate = filter.endDate || new Date();

    // Generate time periods
    const periods = this.generateTimePeriods(startDate, endDate, period);

    const trends: AnswerTrendData[] = [];

    // Calculate metrics for each period
    for (let i = 0; i < periods.length - 1; i++) {
      const periodStart = periods[i];
      const periodEnd = periods[i + 1];

      const periodFilter = {
        ...filter,
        startDate: periodStart,
        endDate: periodEnd,
      };

      // Get answers for this period
      const answers = await this.answerRepository.find({
        where: this.buildWhereClause(periodFilter),
        relations: ['scores'],
      });

      // Calculate metrics
      const answersGenerated = answers.length;
      const validatedAnswers = answers.filter(
        a => a.status === 'validated',
      ).length;
      const validationPassRate =
        answersGenerated > 0 ? validatedAnswers / answersGenerated : 0;

      // Calculate average overall score
      let totalScore = 0;
      let scoreCount = 0;

      answers.forEach(answer => {
        const overallScores = answer.scores
          .filter(s => s.metricType === ScoreMetricType.OVERALL)
          .map(s => s.score);

        if (overallScores.length > 0) {
          totalScore += this.calculateAverage(overallScores);
          scoreCount++;
        }
      });

      const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

      // Format period label
      const periodLabel = this.formatPeriodLabel(periodStart, period);

      trends.push({
        period: periodLabel,
        metrics: {
          answersGenerated,
          validationPassRate,
          averageScore,
        },
      });
    }

    return trends;
  }

  /**
   * Get top categories for answers
   *
   * @param filter - Analytics filter parameters
   * @param limit - Maximum number of categories to return
   * @returns Top categories with counts
   */
  async getTopCategories(
    filter: AnalyticsFilter = {},
    limit = 10,
  ): Promise<{ category: string; count: number }[]> {
    const answers = await this.answerRepository.find({
      where: this.buildWhereClause(filter),
      relations: ['metadata'],
    });

    // Extract categories from metadata
    const categoryMap = new Map<string, number>();

    answers.forEach(answer => {
      const categoriesMetadata = answer.metadata?.find(
        m => m.key === 'categories' && m.valueType === 'json',
      );
      if (categoriesMetadata?.jsonValue?.categories) {
        const categories = categoriesMetadata.jsonValue.categories;
        if (Array.isArray(categories)) {
          categories.forEach(category => {
            const count = categoryMap.get(category) || 0;
            categoryMap.set(category, count + 1);
          });
        }
      }
    });

    // Convert map to array and sort
    const categories = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return categories;
  }

  /**
   * Get status distribution for answers
   *
   * @param filter - Analytics filter parameters
   * @returns Status distribution with counts
   */
  async getStatusDistribution(
    filter: AnalyticsFilter = {},
  ): Promise<{ status: string; count: number }[]> {
    const statuses = ['pending', 'validated', 'rejected', 'failed'];
    const distribution: { status: string; count: number }[] = [];

    for (const status of statuses) {
      const count = await this.answerRepository.count({
        where: {
          ...this.buildWhereClause(filter),
          status,
        },
      });

      distribution.push({ status, count });
    }

    return distribution;
  }

  /**
   * Build TypeORM where clause from filter
   *
   * @param filter - Analytics filter parameters
   * @returns Where clause object
   */
  private buildWhereClause(filter: AnalyticsFilter = {}): any {
    const whereClause: any = {};

    if (filter.startDate && filter.endDate) {
      whereClause.createdAt = Between(filter.startDate, filter.endDate);
    } else if (filter.startDate) {
      whereClause.createdAt = MoreThanOrEqual(filter.startDate);
    } else if (filter.endDate) {
      whereClause.createdAt = LessThanOrEqual(filter.endDate);
    }

    if (filter.status) {
      whereClause.status = filter.status;
    }

    if (filter.queryIds && filter.queryIds.length > 0) {
      whereClause.queryId = In(filter.queryIds);
    }

    return whereClause;
  }

  /**
   * Build date filter string for query builder
   *
   * @param filter - Analytics filter parameters
   * @returns Date filter string
   */
  private buildDateFilter(filter: AnalyticsFilter = {}): string | null {
    if (filter.startDate && filter.endDate) {
      return `BETWEEN '${filter.startDate.toISOString()}' AND '${filter.endDate.toISOString()}'`;
    } else if (filter.startDate) {
      return `>= '${filter.startDate.toISOString()}'`;
    } else if (filter.endDate) {
      return `<= '${filter.endDate.toISOString()}'`;
    }

    return null;
  }

  /**
   * Generate time periods for trend analysis
   *
   * @param startDate - Start date
   * @param endDate - End date
   * @param period - Aggregation period
   * @returns Array of period boundary dates
   */
  private generateTimePeriods(
    startDate: Date,
    endDate: Date,
    period: AggregationPeriod,
  ): Date[] {
    const periods: Date[] = [new Date(startDate)];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      switch (period) {
        case AggregationPeriod.DAY:
          currentDate = new Date(
            currentDate.setDate(currentDate.getDate() + 1),
          );
          break;
        case AggregationPeriod.WEEK:
          currentDate = new Date(
            currentDate.setDate(currentDate.getDate() + 7),
          );
          break;
        case AggregationPeriod.MONTH:
          currentDate = new Date(
            currentDate.setMonth(currentDate.getMonth() + 1),
          );
          break;
        case AggregationPeriod.QUARTER: {
          const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
          currentDate = new Date(
            currentDate.setMonth(currentDate.getMonth() + 3),
          );
          break;
        }
        case AggregationPeriod.YEAR:
          currentDate = new Date(
            currentDate.setFullYear(currentDate.getFullYear() + 1),
          );
          break;
      }

      if (currentDate <= endDate) {
        periods.push(new Date(currentDate));
      }
    }

    if (periods[periods.length - 1].getTime() !== endDate.getTime()) {
      periods.push(new Date(endDate));
    }

    return periods;
  }

  /**
   * Format period label for trend data
   *
   * @param date - Period start date
   * @param period - Aggregation period
   * @returns Formatted period label
   */
  private formatPeriodLabel(date: Date, period: AggregationPeriod): string {
    switch (period) {
      case AggregationPeriod.DAY:
        return date.toISOString().split('T')[0];
      case AggregationPeriod.WEEK:
        return `Week of ${date.toISOString().split('T')[0]}`;
      case AggregationPeriod.MONTH:
        return `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
      case AggregationPeriod.QUARTER: {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        return `Q${quarter} ${date.getFullYear()}`;
      }
      case AggregationPeriod.YEAR:
        return date.getFullYear().toString();
      default:
        return date.toISOString().split('T')[0];
    }
  }

  /**
   * Calculate average of an array of numbers
   *
   * @param values - Array of numbers
   * @returns Average value
   */
  private calculateAverage(values: number[]): number {
    if (!values || values.length === 0) {
      return 0;
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }
}
