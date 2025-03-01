import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  FindManyOptions,
  EntityNotFoundError,
  Between,
} from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import {
  EngagementTrend,
  TopIntent,
  TopTopic,
} from '../interfaces/conversation-analysis.interface';
import {
  ConversationTrendsType,
  EngagementTrendPoint,
} from '../graphql/types/conversation-trends.type';
import { ConversationInsightType } from '../graphql/types/conversation-insight.type';
import { ConversationInsightOptionsInput } from '../graphql/inputs/conversation-insight-options.input';
import { TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { ConversationInsightDto } from '../dto/conversation-insight.dto';

/**
 * Repository for conversations
 */
@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(private dataSource: DataSource) {
    super(Conversation, dataSource.createEntityManager());
  }

  /**
   * Find conversations by brand ID
   * @param brandId ID of the brand
   * @param options Additional find options
   * @returns Array of conversations
   */
  async findByBrandId(
    brandId: string,
    options: FindManyOptions<Conversation>,
  ): Promise<Conversation[]> {
    return this.find({
      where: { brandId },
      ...options,
    });
  }

  /**
   * Find a conversation with its insights
   * @param id ID of the conversation
   * @returns The conversation with its insights
   */
  async findWithInsights(id: string): Promise<Conversation | null> {
    return this.findOne({
      where: { id },
      relations: ['_insights'],
    });
  }

  /**
   * Get date range from options
   * @param options Options containing start and end dates
   * @returns Object with startDate and endDate
   */
  private getDateRange(options: TrendOptionsDto): {
    startDate: Date;
    endDate: Date;
  } {
    const startDate =
      options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();
    return { startDate, endDate };
  }

  /**
   * Get engagement trend for a brand
   * @param brandId ID of the brand
   * @param options Options for filtering trends
   * @returns Engagement trend for the brand
   */
  async getEngagementTrend(
    brandId: string,
    options: TrendOptionsDto = {},
  ): Promise<EngagementTrendPoint[]> {
    const { startDate, endDate } = this.getDateRange(options);

    // Implementation details...
    return [];
  }

  /**
   * Get trends for a brand
   * @param brandId ID of the brand
   * @param options Options for filtering trends
   * @returns Trends for the brand
   */
  async getTrends(
    brandId: string,
    options: TrendOptionsDto = {},
  ): Promise<ConversationTrendsType> {
    const { startDate, endDate } = this.getDateRange(options);

    // Find conversations for the brand
    const conversations = await this.find({
      where: {
        brandId,
        ...(startDate && endDate
          ? { _analyzedAt: Between(startDate, endDate) }
          : {}),
      },
      relations: ['_insights'],
    });

    // Extract trends
    return {
      topIntents: this.extractTopIntents(conversations),
      topTopics: this.extractTopTopics(conversations),
      commonActions: this.extractCommonActions(conversations),
      engagementTrend: await this.getEngagementTrend(brandId, options),
    };
  }

  async findInsightsByBrandId(
    brandId: string,
    options?: ConversationInsightOptionsInput,
  ): Promise<ConversationInsightType[]> {
    const qb = this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation._insights', 'insight')
      .where('conversation.brandId = :brandId', { brandId });

    if (options?.type) {
      qb.andWhere('insight.type = :type', { type: options.type });
    }

    if (options?.startDate) {
      qb.andWhere('conversation._analyzedAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options?.endDate) {
      qb.andWhere('conversation._analyzedAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const conversations = await qb.getMany();

    // Convert ConversationInsight to ConversationInsightType
    return conversations.flatMap(conv => {
      // Use type assertion to handle property name mismatch
      const convAny = conv as any;
      return convAny._insights.map((insight: ConversationInsightDto) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: JSON.stringify(insight.details),
      }));
    });
  }

  /**
   * Extract insights from conversations
   * @param conversations Conversations to extract insights from
   * @returns Insights extracted from the conversations
   */
  private extractInsights(
    conversations: Conversation[],
  ): ConversationInsightDto[] {
    return conversations.flatMap(conv => {
      // Use type assertion to handle property name mismatch
      const convAny = conv as any;
      return convAny._insights.map((insight: ConversationInsightDto) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: insight.details,
      }));
    });
  }

  /**
   * Extract top intents from conversations
   * @param conversations Conversations to extract intents from
   * @returns Top intents extracted from the conversations
   */
  private extractTopIntents(conversations: Conversation[]): TopIntent[] {
    // Collect all intent insights
    const intents = conversations.flatMap(conv => {
      // Use type assertion to handle property name mismatch
      const convAny = conv as any;
      return convAny._insights.filter(
        (insight: ConversationInsightDto) => insight.type === 'intent',
      );
    });

    interface IntentAccumulator {
      [key: string]: { count: number; totalConfidence: number };
    }

    const intentMap = intents.reduce<IntentAccumulator>((acc, intent) => {
      const key = intent.category;
      if (!acc[key]) {
        acc[key] = { count: 0, totalConfidence: 0 };
      }
      acc[key].count++;
      acc[key].totalConfidence += intent.confidence;
      return acc;
    }, {});

    return Object.entries(intentMap)
      .map(([category, data]) => ({
        category,
        count: data.count,
        averageConfidence: data.totalConfidence / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Extract top topics from conversations
   * @param conversations Conversations to extract topics from
   * @returns Top topics extracted from the conversations
   */
  private extractTopTopics(conversations: Conversation[]): TopTopic[] {
    // Collect all topic insights
    const topics = conversations.flatMap(conv => {
      // Use type assertion to handle property name mismatch
      const convAny = conv as any;
      return convAny._insights.filter(
        (insight: ConversationInsightDto) => insight.type === 'topic',
      );
    });

    // Group by category
    const topicMap: Record<string, { count: number; totalRelevance: number }> =
      {};
    topics.forEach(topic => {
      const name = topic.category;
      if (!topicMap[name]) {
        topicMap[name] = { count: 0, totalRelevance: 0 };
      }
      topicMap[name].count++;
      topicMap[name].totalRelevance += topic.confidence;
    });

    // Convert to array and calculate averages
    return Object.entries(topicMap)
      .map(([name, { count, totalRelevance }]) => ({
        name,
        count,
        averageRelevance: count > 0 ? totalRelevance / count : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Extract common actions from conversations
   * @param conversations Conversations to extract actions from
   * @returns Common actions extracted from the conversations
   */
  private extractCommonActions(
    conversations: Conversation[],
  ): Array<{ type: string; count: number; averageConfidence: number }> {
    // Collect all action insights
    const actions = conversations.flatMap(conv => {
      // Use type assertion to handle property name mismatch
      const convAny = conv as any;
      return convAny._insights.filter(
        (insight: ConversationInsightDto) => insight.type === 'action',
      );
    });

    interface ActionAccumulator {
      [key: string]: { count: number; totalConfidence: number };
    }

    const actionMap = actions.reduce<ActionAccumulator>((acc, action) => {
      const key = action.category;
      if (!actionMap[key]) {
        actionMap[key] = { count: 0, totalConfidence: 0 };
      }
      actionMap[key].count++;
      actionMap[key].totalConfidence += action.confidence;
      return acc;
    }, {});

    return Object.entries(actionMap)
      .map(([type, data]) => ({
        type,
        count: data.count,
        averageConfidence: data.totalConfidence / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
