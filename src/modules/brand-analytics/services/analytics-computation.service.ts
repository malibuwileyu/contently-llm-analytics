import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MentionRepository } from '../repositories/mention.repository';
import { CompetitorRepository } from '../repositories/competitor.repository';
import { AnalyticsResultRepository } from '../repositories/analytics-result.repository';
import { AnalyticsResultEntity } from '../entities/analytics-result.entity';
import { CompetitorEntity } from '../entities/competitor.entity';

/**
 * Service for computing analytics from mention data
 */
@Injectable()
export class AnalyticsComputationService {
  private readonly logger = new Logger(AnalyticsComputationService.name);

  constructor(
    @InjectRepository(MentionRepository)
    private readonly mentionRepository: MentionRepository,
    @InjectRepository(CompetitorRepository)
    private readonly competitorRepository: CompetitorRepository,
    @InjectRepository(AnalyticsResultRepository)
    private readonly analyticsResultRepository: AnalyticsResultRepository,
  ) {}

  /**
   * Compute mention frequency analytics for a business category
   * @param businessCategoryId The business category ID
   * @param startDate Start date for the analysis period
   * @param endDate End date for the analysis period
   * @param timeFrame Time frame for the analysis (daily, weekly, monthly, all_time)
   * @returns Array of analytics results
   */
  async computeMentionFrequency(
    businessCategoryId: string,
    startDate: Date,
    endDate: Date,
    timeFrame: string,
  ): Promise<AnalyticsResultEntity[]> {
    this.logger.debug(
      `Computing mention frequency for category ${businessCategoryId} from ${startDate} to ${endDate}`,
    );

    // Get all competitors in the category
    const competitors =
      await this.competitorRepository.findByBusinessCategory(
        businessCategoryId,
      );

    if (competitors.length === 0) {
      this.logger.warn(
        `No competitors found for category ${businessCategoryId}`,
      );
      return [];
    }

    // Get mention statistics for the time period
    const mentionStats = await this.mentionRepository.getStatsByTimePeriod(
      startDate,
      endDate,
    );

    // Calculate total mentions
    let totalMentions = 0;
    for (const competitorId in mentionStats) {
      totalMentions += mentionStats[competitorId];
    }

    if (totalMentions === 0) {
      this.logger.warn(
        `No mentions found for category ${businessCategoryId} in the specified time period`,
      );
      return [];
    }

    // Create analytics results for each competitor
    const results: AnalyticsResultEntity[] = [];

    // Calculate percentages and create result entities
    const competitorResults = competitors.map(competitor => {
      const mentions = mentionStats[competitor.id] || 0;
      const percentage =
        totalMentions > 0 ? (mentions / totalMentions) * 100 : 0;

      return {
        competitor,
        mentions,
        percentage,
      };
    });

    // Sort by percentage (descending)
    competitorResults.sort((a, b) => b.percentage - a.percentage);

    // Create result entities with ranks
    for (let i = 0; i < competitorResults.length; i++) {
      const { competitor, mentions, percentage } = competitorResults[i];

      const result = new AnalyticsResultEntity();
      result.businessCategoryId = businessCategoryId;
      result.competitorId = competitor.id;
      result.type = 'mention_frequency';
      result.timeFrame = timeFrame;
      result.startDate = startDate;
      result.endDate = endDate;
      result.value = percentage;
      result.rank = i + 1;
      result.totalMentions = mentions;
      result.totalResponses = totalMentions;

      // Calculate statistical significance
      result.isStatisticallySignificant = this.isStatisticallySignificant(
        mentions,
        totalMentions,
        0.95, // 95% confidence level
      );

      // Calculate confidence interval
      result.confidenceInterval = this.calculateConfidenceInterval(
        mentions,
        totalMentions,
        0.95, // 95% confidence level
      );

      results.push(result);
    }

    // Save results to database
    await this.analyticsResultRepository.save(results);

    return results;
  }

  /**
   * Compute sentiment analytics for a business category
   * @param businessCategoryId The business category ID
   * @param startDate Start date for the analysis period
   * @param endDate End date for the analysis period
   * @param timeFrame Time frame for the analysis (daily, weekly, monthly, all_time)
   * @returns Array of analytics results
   */
  async computeSentimentAnalytics(
    businessCategoryId: string,
    startDate: Date,
    endDate: Date,
    timeFrame: string,
  ): Promise<AnalyticsResultEntity[]> {
    this.logger.debug(
      `Computing sentiment analytics for category ${businessCategoryId} from ${startDate} to ${endDate}`,
    );

    // Get all competitors in the category
    const competitors =
      await this.competitorRepository.findByBusinessCategory(
        businessCategoryId,
      );

    if (competitors.length === 0) {
      this.logger.warn(
        `No competitors found for category ${businessCategoryId}`,
      );
      return [];
    }

    // Create analytics results for each competitor
    const results: AnalyticsResultEntity[] = [];

    for (const competitor of competitors) {
      // Get all mentions for this competitor in the time period
      const mentions = await this.mentionRepository
        .createQueryBuilder('mention')
        .where('mention.competitorId = :competitorId', {
          competitorId: competitor.id,
        })
        .andWhere('mention.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('mention.sentimentScore IS NOT NULL')
        .getMany();

      if (mentions.length === 0) {
        continue;
      }

      // Calculate average sentiment score
      let totalScore = 0;
      for (const mention of mentions) {
        totalScore += mention.sentimentScore || 0;
      }

      const averageScore = totalScore / mentions.length;

      // Create result entity
      const result = new AnalyticsResultEntity();
      result.businessCategoryId = businessCategoryId;
      result.competitorId = competitor.id;
      result.type = 'sentiment_analysis';
      result.timeFrame = timeFrame;
      result.startDate = startDate;
      result.endDate = endDate;
      result.value = averageScore;
      result.totalMentions = mentions.length;

      // Calculate sentiment distribution
      const sentimentCounts: Record<string, number> = {
        positive: 0,
        neutral: 0,
        negative: 0,
      };

      for (const mention of mentions) {
        if (
          mention.sentimentLabel &&
          (mention.sentimentLabel === 'positive' ||
            mention.sentimentLabel === 'neutral' ||
            mention.sentimentLabel === 'negative')
        ) {
          sentimentCounts[mention.sentimentLabel]++;
        }
      }

      result.additionalData = {
        sentimentDistribution: {
          positive: (sentimentCounts.positive / mentions.length) * 100,
          neutral: (sentimentCounts.neutral / mentions.length) * 100,
          negative: (sentimentCounts.negative / mentions.length) * 100,
        },
      };

      results.push(result);
    }

    // Sort by sentiment score (descending) and assign ranks
    results.sort((a, b) => b.value - a.value);

    for (let i = 0; i < results.length; i++) {
      results[i].rank = i + 1;
    }

    // Save results to database
    await this.analyticsResultRepository.save(results);

    return results;
  }

  /**
   * Compute feature association analytics for a business category
   * @param businessCategoryId The business category ID
   * @param startDate Start date for the analysis period
   * @param endDate End date for the analysis period
   * @param timeFrame Time frame for the analysis (daily, weekly, monthly, all_time)
   * @returns Array of analytics results
   */
  async computeFeatureAssociations(
    businessCategoryId: string,
    startDate: Date,
    endDate: Date,
    timeFrame: string,
  ): Promise<AnalyticsResultEntity[]> {
    this.logger.debug(
      `Computing feature associations for category ${businessCategoryId} from ${startDate} to ${endDate}`,
    );

    // Get all competitors in the category
    const competitors =
      await this.competitorRepository.findByBusinessCategory(
        businessCategoryId,
      );

    if (competitors.length === 0) {
      this.logger.warn(
        `No competitors found for category ${businessCategoryId}`,
      );
      return [];
    }

    // Common features to analyze
    const features = [
      'quality',
      'price',
      'design',
      'comfort',
      'durability',
      'performance',
      'style',
      'support',
      'lightweight',
      'waterproof',
    ];

    // Create analytics results for each competitor and feature
    const results: AnalyticsResultEntity[] = [];

    for (const competitor of competitors) {
      // Get all mentions for this competitor in the time period
      const mentions = await this.mentionRepository
        .createQueryBuilder('mention')
        .where('mention.competitorId = :competitorId', {
          competitorId: competitor.id,
        })
        .andWhere('mention.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .getMany();

      if (mentions.length === 0) {
        continue;
      }

      // Count feature associations
      const featureCounts: Record<string, number> = {};
      let totalFeatureMentions = 0;

      for (const mention of mentions) {
        if (
          mention.associatedFeatures &&
          mention.associatedFeatures.length > 0
        ) {
          for (const feature of mention.associatedFeatures) {
            if (features.includes(feature)) {
              featureCounts[feature] = (featureCounts[feature] || 0) + 1;
              totalFeatureMentions++;
            }
          }
        }
      }

      // Create result entity with feature distribution
      const result = new AnalyticsResultEntity();
      result.businessCategoryId = businessCategoryId;
      result.competitorId = competitor.id;
      result.type = 'feature_association';
      result.timeFrame = timeFrame;
      result.startDate = startDate;
      result.endDate = endDate;
      result.value = totalFeatureMentions;
      result.totalMentions = mentions.length;

      // Calculate feature distribution
      const featureDistribution: Record<string, number> = {};

      for (const feature of features) {
        featureDistribution[feature] =
          totalFeatureMentions > 0
            ? ((featureCounts[feature] || 0) / totalFeatureMentions) * 100
            : 0;
      }

      result.additionalData = { featureDistribution };

      results.push(result);
    }

    // Save results to database
    await this.analyticsResultRepository.save(results);

    return results;
  }

  /**
   * Check if a result is statistically significant
   * @param mentions Number of mentions for a competitor
   * @param totalMentions Total number of mentions
   * @param confidenceLevel Confidence level (e.g., 0.95 for 95%)
   * @returns Whether the result is statistically significant
   */
  private isStatisticallySignificant(
    mentions: number,
    totalMentions: number,
    confidenceLevel: number,
  ): boolean {
    // For _simplicity, we'll consider a result significant if:
    // 1. We have at least 30 total mentions (central limit theorem)
    // 2. The competitor has at least 5 mentions
    // 3. The confidence interval is less than 10 percentage points

    if (totalMentions < 30 || mentions < 5) {
      return false;
    }

    const confidenceInterval = this.calculateConfidenceInterval(
      mentions,
      totalMentions,
      confidenceLevel,
    );

    return confidenceInterval < 10;
  }

  /**
   * Calculate confidence interval for a proportion
   * @param mentions Number of mentions for a competitor
   * @param totalMentions Total number of mentions
   * @param confidenceLevel Confidence level (e.g., 0.95 for 95%)
   * @returns Confidence interval (in percentage points)
   */
  private calculateConfidenceInterval(
    mentions: number,
    totalMentions: number,
    confidenceLevel: number,
  ): number {
    if (totalMentions === 0) {
      return 100; // Maximum uncertainty
    }

    const proportion = mentions / totalMentions;

    // Z-score for the given confidence level
    // For 95% confidence, z = 1.96
    const z = 1.96;

    // Standard error of the proportion
    const standardError = Math.sqrt(
      (proportion * (1 - proportion)) / totalMentions,
    );

    // Margin of error (in percentage points)
    const marginOfError = z * standardError * 100;

    return marginOfError;
  }
}
