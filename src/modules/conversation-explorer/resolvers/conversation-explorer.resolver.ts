import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { Conversation } from '../entities/conversation.entity';
import { ConversationInsight } from '../entities/conversation-insight.entity';
import { AnalyzeConversationInput } from '../graphql/inputs/analyze-conversation.input';
import { TrendOptionsInput } from '../graphql/inputs/trend-options.input';
import { ConversationTrendsType } from '../graphql/types/conversation-trends.type';
import { ConversationType } from '../graphql/types/conversation.type';
import { ConversationInsightType } from '../graphql/types/conversation-insight.type';
import { ConversationInsightOptionsInput } from '../graphql/inputs/conversation-insight-options.input';

/**
 * GraphQL resolver for the Conversation Explorer
 */
@Resolver(() => ConversationType)
export class ConversationExplorerResolver {
  constructor(
    private readonly conversationExplorerService: ConversationExplorerService
  ) {}

  /**
   * Analyze a conversation to extract insights
   * @param input Conversation data to analyze
   * @returns Analyzed conversation with insights
   */
  @Mutation(() => ConversationType)
  @UseGuards(GqlAuthGuard)
  async analyzeConversation(
    @Args('input') input: AnalyzeConversationInput
  ): Promise<Conversation> {
    return this.conversationExplorerService.analyzeConversation({
      brandId: input.brandId,
      messages: input.messages,
      metadata: input.metadata
    });
  }

  /**
   * Get trends from conversations
   * @param brandId ID of the brand
   * @param options Options for retrieving trends
   * @returns Conversation trends
   */
  @Query(() => ConversationTrendsType)
  @UseGuards(GqlAuthGuard)
  async conversationTrends(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: TrendOptionsInput
  ) {
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = options?.endDate || new Date();

    return this.conversationExplorerService.getConversationTrends(
      brandId,
      { startDate, endDate }
    );
  }

  /**
   * Get a conversation by ID
   * @param id ID of the conversation
   * @returns Conversation with insights
   */
  @Query(() => ConversationType)
  @UseGuards(GqlAuthGuard)
  async conversation(
    @Args('id') id: string
  ): Promise<Conversation> {
    return this.conversationExplorerService['conversationRepo'].findWithInsights(id);
  }

  /**
   * Get conversations by brand ID
   * @param brandId ID of the brand
   * @returns Array of conversations
   */
  @Query(() => [ConversationType])
  @UseGuards(GqlAuthGuard)
  async conversationsByBrand(
    @Args('brandId') brandId: string
  ): Promise<Conversation[]> {
    return this.conversationExplorerService['conversationRepo'].findByBrandId(brandId);
  }

  /**
   * Resolve insights field for a conversation
   * @param conversation Parent conversation
   * @returns Array of conversation insights
   */
  @ResolveField('insights', () => [ConversationInsightType])
  async getInsights(
    @Parent() conversation: Conversation
  ): Promise<ConversationInsight[]> {
    const { id } = conversation;
    const fullConversation = await this.conversationExplorerService['conversationRepo'].findWithInsights(id);
    return fullConversation.insights;
  }

  @Query(() => [ConversationInsightType], { name: 'conversationInsights' })
  async getConversationInsights(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: ConversationInsightOptionsInput
  ): Promise<ConversationInsightType[]> {
    return this.conversationExplorerService.getConversationInsights(brandId, options);
  }
} 