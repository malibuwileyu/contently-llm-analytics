import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { TopicGapAnalyzerService } from '../services/topic-gap-analyzer.service';
import {
  TopicGapAnalysisOptionsInput,
  TopicGapAnalysisResultsType
} from '../graphql/topic-gap.types';

/**
 * GraphQL resolver for topic gap analysis
 */
@Resolver(() => TopicGapAnalysisResultsType)
@UseGuards(GqlAuthGuard)
export class TopicGapAnalyzerResolver {
  private readonly logger = new Logger(TopicGapAnalyzerResolver.name);

  constructor(
    private readonly topicGapAnalyzerService: TopicGapAnalyzerService
  ) {}

  /**
   * Get topic gaps for a specific brand
   */
  @Query(() => TopicGapAnalysisResultsType, { name: 'topicGaps', description: 'Get topic gaps for a brand' })
  async getTopicGaps(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: TopicGapAnalysisOptionsInput
  ): Promise<TopicGapAnalysisResultsType> {
    this.logger.debug(`Getting topic gaps for brand: ${brandId}`);
    
    const result = await this.topicGapAnalyzerService.analyzeTopicGaps(
      brandId,
      options ? {
        startDate: options.startDate ? new Date(options.startDate) : undefined,
        endDate: options.endDate ? new Date(options.endDate) : undefined,
        minFrequency: options.minFrequency,
        minGapScore: options.minGapScore,
        limit: options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      gaps: result.gaps,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalConversationsAnalyzed: result.totalConversationsAnalyzed
    };
  }
} 