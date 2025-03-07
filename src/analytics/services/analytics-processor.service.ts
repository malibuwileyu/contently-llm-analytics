import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { AnalyticsResult } from '../entities/analytics-result.entity';
import { BrandVisibilityService } from './brand-visibility.service';
import { CustomerResearchService } from '../../modules/brand-analytics/services/customer-research.service';

interface AnalysisResult {
  question: string;
  aiResponse: {
    content: string;
    metadata: Record<string, any>;
  };
  brandHealth: {
    visibilityMetrics: {
      overallVisibility: number;
      categoryRankings: Record<string, number>;
      competitorComparison: Record<
        string,
        {
          visibility: number;
          relativeDelta: number;
        }
      >;
    };
    llmPresence: {
      knowledgeBaseStrength: number;
      contextualAuthority: number;
      topicalLeadership: string[];
    };
    trendsOverTime: {
      visibilityTrend: string;
      rankingStability: number;
      competitorDynamics: string;
    };
  };
  brandMentions: Array<{
    visibility: {
      prominence: number;
      contextScore: number;
      competitorProximity: Array<{
        competitor: string;
        distance: number;
        relationship: string;
      }>;
    };
    knowledgeBaseMetrics: {
      citationFrequency: number;
      authorityScore: number;
      categoryLeadership: string;
    };
  }>;
  metrics: {
    visibilityStats: {
      prominenceScore: number;
    };
  };
}

@Injectable()
export class AnalyticsProcessorService {
  private readonly logger = new Logger(AnalyticsProcessorService.name);

  constructor(
    @InjectRepository(AnalyticsResult)
    private readonly analyticsResultRepository: Repository<AnalyticsResult>,
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
    private readonly brandVisibilityService: BrandVisibilityService,
    private readonly customerResearchService: CustomerResearchService,
    private readonly dataSource: DataSource,
  ) {}

  async processAnalysis(
    customer: CompetitorEntity,
    analysis: AnalysisResult,
    queryType: string,
  ): Promise<AnalyticsResult> {
    try {
      // Calculate derived metrics
      const mentionCount = analysis.brandMentions.length;
      const sentimentScore =
        analysis.brandMentions.reduce(
          (sum, mention) => sum + mention.knowledgeBaseMetrics.authorityScore,
          0,
        ) / mentionCount;
      const relevanceScore =
        (analysis.brandMentions[0].visibility.contextScore +
          analysis.brandHealth.visibilityMetrics.overallVisibility) /
        2;

      // Create the analytics result
      const result = new AnalyticsResult();
      result.companyId = customer.id;
      result.queryText = analysis.question;
      result.responseText = analysis.aiResponse.content;
      result.visibilityScore =
        analysis.brandHealth.visibilityMetrics.overallVisibility;
      result.prominenceScore = analysis.metrics.visibilityStats.prominenceScore;
      result.contextScore = analysis.brandMentions[0].visibility.contextScore;
      result.authorityScore =
        analysis.brandMentions[0].knowledgeBaseMetrics.authorityScore;
      result.citationFrequency =
        analysis.brandMentions[0].knowledgeBaseMetrics.citationFrequency;
      result.categoryLeadership =
        analysis.brandMentions[0].knowledgeBaseMetrics.categoryLeadership;
      result.competitorProximity =
        analysis.brandMentions[0].visibility.competitorProximity;
      result.knowledgeBaseMetrics = analysis.brandHealth.llmPresence;
      result.trends = analysis.brandHealth.trendsOverTime;
      result.responseMetadata = analysis.aiResponse.metadata;
      result.queryType = queryType;
      result.timestamp = new Date();
      result.analysis = analysis;
      result.metadata = {
        version: '1.0.0',
        batchId: new Date().toISOString(),
        queryType,
        index: 1,
      };
      result.mentionCount = mentionCount;
      result.sentimentScore = sentimentScore;
      result.relevanceScore = relevanceScore;

      // Save the result
      return await this.analyticsResultRepository.save(result);
    } catch (error) {
      this.logger.error(
        `Error processing analysis for customer ${customer.name}:`,
        error,
      );
      throw error;
    }
  }

  async processBatch(
    customer: CompetitorEntity,
    questions: string[],
    queryType: string,
  ): Promise<AnalyticsResult[]> {
    try {
      // Get analysis results from brand visibility service
      const batchResults =
        await this.brandVisibilityService.analyzeBrandVisibilityBatch(
          customer,
          questions,
          { maxConcurrent: 2 },
        );

      // Process each analysis result
      const results = await Promise.all(
        batchResults.map(analysis =>
          this.processAnalysis(customer, analysis, queryType),
        ),
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error processing batch for customer ${customer.name}:`,
        error,
      );
      throw error;
    }
  }
}
