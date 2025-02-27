import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { QueryTrendAnalysisService } from '../services/query-trend-analysis.service';
import { QueryTrendOptionsInput, QueryTrendAnalysisType } from '../graphql/query-trend.types';

/**
 * GraphQL resolver for query trend analysis
 */
@Resolver(() => QueryTrendAnalysisType)
@UseGuards(GqlAuthGuard)
export class QueryTrendResolver {
  private readonly logger = new Logger(QueryTrendResolver.name);

  constructor(
    private readonly queryTrendService: QueryTrendAnalysisService
  ) {}

  /**
   * Get query trends for a specific brand
   */
  @Query(() => QueryTrendAnalysisType, { name: 'queryTrends', description: 'Get query trends for a brand' })
  async getQueryTrends(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: QueryTrendOptionsInput
  ): Promise<QueryTrendAnalysisType> {
    this.logger.debug(`Getting query trends for brand: ${brandId}`);
    
    // Parse options
    const parsedOptions = options ? {
      startDate: options.startDate ? new Date(options.startDate) : undefined,
      endDate: options.endDate ? new Date(options.endDate) : undefined,
      minFrequency: options.minFrequency,
      limit: options.limit
    } : undefined;

    const result = await this.queryTrendService.analyzeQueryTrends(brandId, parsedOptions);
    
    // Convert Date objects to ISO strings for the response
    return {
      risingTrends: result.risingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      fallingTrends: result.fallingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      stableTrends: result.stableTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      }
    };
  }
} 