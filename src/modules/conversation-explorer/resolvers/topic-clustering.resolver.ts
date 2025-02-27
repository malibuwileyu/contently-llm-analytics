import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { TopicClusteringService } from '../services/topic-clustering.service';
import { TopicClusteringOptionsInput, TopicClusteringResultsType } from '../graphql/topic-cluster.types';

/**
 * GraphQL resolver for topic clustering
 */
@Resolver(() => TopicClusteringResultsType)
@UseGuards(GqlAuthGuard)
export class TopicClusteringResolver {
  private readonly logger = new Logger(TopicClusteringResolver.name);

  constructor(
    private readonly topicClusteringService: TopicClusteringService
  ) {}

  /**
   * Get topic clusters for a specific brand
   */
  @Query(() => TopicClusteringResultsType, { name: 'topicClusters', description: 'Get topic clusters for a brand' })
  async getTopicClusters(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: TopicClusteringOptionsInput
  ): Promise<TopicClusteringResultsType> {
    this.logger.debug(`Getting topic clusters for brand: ${brandId}`);
    
    const result = await this.topicClusteringService.clusterTopics(
      brandId,
      options ? {
        startDate: options.startDate ? new Date(options.startDate) : undefined,
        endDate: options.endDate ? new Date(options.endDate) : undefined,
        minFrequency: options.minFrequency,
        similarityThreshold: options.similarityThreshold,
        limit: options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      clusters: result.clusters,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopics: result.totalTopics,
      totalConversations: result.totalConversations
    };
  }
} 