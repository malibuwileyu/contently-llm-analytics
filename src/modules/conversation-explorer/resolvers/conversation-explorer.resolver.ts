import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Conversation } from '../entities/conversation.entity';
import { AnalyzeConversationInput } from '../graphql/inputs/analyze-conversation.input';
import { TrendOptionsInput } from '../graphql/inputs/trend-options.input';
import { ConversationTrendsType } from '../graphql/types/conversation-trends.type';
import { ConversationType } from '../graphql/types/conversation.type';
import { ConversationInsightType } from '../graphql/types/conversation-insight.type';
import { ConversationInsightOptionsInput } from '../graphql/inputs/conversation-insight-options.input';
import { AnalyzeConversationDto } from '../dto/analyze-conversation.dto';

/**
 * GraphQL resolver for the Conversation Explorer
 */
@Resolver(() => ConversationType)
export class ConversationExplorerResolver {
  constructor(
    private readonly conversationExplorerService: ConversationExplorerService,
  ) {}

  /**
   * Analyze a conversation to extract insights
   * @param input Conversation data to analyze
   * @returns Analyzed conversation with insights
   */
  @Mutation(() => ConversationType)
  @UseGuards(JwtAuthGuard)
  async analyzeConversation(
    @Args('input') input: AnalyzeConversationInput,
  ): Promise<Conversation> {
    // Create a DTO that matches what the service expects
    const dto: AnalyzeConversationDto = {
      conversationId: '', // Generate a new conversation
      brandId: input.brandId,
      messages: input.messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      metadata: {
        platform: input.metadata?.platform || '',
        context: input.metadata?.context || '',
        tags: input.metadata?.tags || [],
      },
    };

    return this.conversationExplorerService.analyzeConversation(dto);
  }

  /**
   * Get trends from conversations
   * @param brandId ID of the brand
   * @param options Options for retrieving trends
   * @returns Conversation trends
   */
  @Query(() => ConversationTrendsType)
  @UseGuards(JwtAuthGuard)
  async conversationTrends(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: TrendOptionsInput,
  ): Promise<ConversationTrendsType> {
    const startDate =
      options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options?.endDate || new Date();

    return this.conversationExplorerService.getConversationTrends(brandId, {
      startDate,
      endDate,
    });
  }

  /**
   * Get a conversation by ID
   * @param id ID of the conversation
   * @returns Conversation with insights
   */
  @Query(() => ConversationType)
  @UseGuards(JwtAuthGuard)
  async conversation(@Args('id') id: string): Promise<Conversation> {
    return this.conversationExplorerService.getConversationById(id);
  }

  /**
   * Get conversations by brand ID
   * @param brandId ID of the brand
   * @returns Array of conversations
   */
  @Query(() => [ConversationType])
  @UseGuards(JwtAuthGuard)
  async conversationsByBrand(
    @Args('brandId') brandId: string,
  ): Promise<Conversation[]> {
    return this.conversationExplorerService.findByBrandId(brandId);
  }

  /**
   * Resolve insights field for a conversation
   * @param conversation Parent conversation
   * @returns Array of conversation insights
   */
  @ResolveField(() => [ConversationInsightType])
  async insights(
    @Parent() conversation: Conversation,
  ): Promise<ConversationInsightType[]> {
    const fullConversation =
      await this.conversationExplorerService.getConversationById(
        conversation.id,
      );
    // Convert ConversationInsight[] to ConversationInsightType[]
    return fullConversation.insights.map(insight => ({
      id: insight.id,
      type: insight.type,
      category: insight.category,
      confidence: insight.confidence,
      details: JSON.stringify(insight.details),
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    }));
  }

  @Query(() => [ConversationInsightType], { name: 'conversationInsights' })
  async getConversationInsights(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true })
    options?: ConversationInsightOptionsInput,
  ): Promise<ConversationInsightType[]> {
    const insights =
      await this.conversationExplorerService.getConversationInsights(
        brandId,
        options,
      );
    // Convert ConversationInsight[] to ConversationInsightType[]
    return insights.map(insight => ({
      id: insight.id,
      type: insight.type,
      category: insight.category,
      confidence: insight.confidence,
      details: JSON.stringify(insight.details),
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    }));
  }
}
