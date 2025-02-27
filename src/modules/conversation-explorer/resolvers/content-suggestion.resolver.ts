import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import {
  ContentSuggestionOptionsInput,
  ContentSuggestionResultsType
} from '../graphql/content-suggestion.types';

/**
 * GraphQL resolver for content suggestions
 */
@Resolver(() => ContentSuggestionResultsType)
@UseGuards(GqlAuthGuard)
export class ContentSuggestionResolver {
  private readonly logger = new Logger(ContentSuggestionResolver.name);

  constructor(
    private readonly contentSuggestionService: ContentSuggestionService
  ) {}

  /**
   * Get content suggestions for a specific brand
   */
  @Query(() => ContentSuggestionResultsType, { name: 'contentSuggestions', description: 'Get content suggestions for a brand' })
  async getContentSuggestions(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: ContentSuggestionOptionsInput
  ): Promise<ContentSuggestionResultsType> {
    this.logger.debug(`Getting content suggestions for brand: ${brandId}`);
    
    const result = await this.contentSuggestionService.suggestContent(
      brandId,
      options ? {
        startDate: options.startDate ? new Date(options.startDate) : undefined,
        endDate: options.endDate ? new Date(options.endDate) : undefined,
        minGapScore: options.minGapScore,
        contentTypes: options.contentTypes,
        limit: options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      suggestions: result.suggestions,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalGapsAnalyzed: result.totalGapsAnalyzed
    };
  }
} 