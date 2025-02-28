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
import { ConversationTrendsType } from '../graphql/types/conversation-trends.type';
import { ConversationInsightType } from '../graphql/types/conversation-insight.type';
import { ConversationInsightOptionsInput } from '../graphql/inputs/conversation-insight-options.input';
import { TrendOptionsDto } from '../dto/analyze-conversation.dto';

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
   * @returns Conversation with insights
   * @throws EntityNotFoundError if the conversation is not found
   */
  async findWithInsights(id: string): Promise<Conversation> {
    const conversation = await this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.insights', 'insights')
      .where('conversation.id = :id', { id })
      .getOne();

    if (!conversation) {
      throw new EntityNotFoundError(Conversation, id);
    }

    return conversation;
  }

  /**
   * Get engagement trend for a brand over time
   * @param brandId ID of the brand
   * @param startDate Start date for the trend
   * @param endDate End date for the trend
   * @returns Array of engagement trend data points
   */
  async getEngagementTrend(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<EngagementTrend[]> {
    return this.createQueryBuilder('conversation')
      .select('DATE(conversation.analyzedAt)', 'date')
      .addSelect('AVG(conversation.engagementScore)', 'averageEngagement')
      .where('conversation.brandId = :brandId', { brandId })
      .andWhere('conversation.analyzedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(conversation.analyzedAt)')
      .orderBy('DATE(conversation.analyzedAt)', 'ASC')
      .getRawMany();
  }

  async getTrends(
    brandId: string,
    options?: TrendOptionsDto,
  ): Promise<Partial<ConversationTrendsType>> {
    const startDate =
      options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options?.endDate || new Date();

    const conversations = await this.find({
      where: {
        brandId,
        analyzedAt: Between(startDate, endDate),
      },
      relations: ['insights'],
    });

    return {
      topIntents: this.extractTopIntents(conversations),
      topTopics: this.extractTopTopics(conversations),
      commonActions: this.extractCommonActions(conversations),
    };
  }

  async findInsightsByBrandId(
    brandId: string,
    options?: ConversationInsightOptionsInput,
  ): Promise<ConversationInsightType[]> {
    const qb = this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.insights', 'insight')
      .where('conversation.brandId = :brandId', { brandId });

    if (options?.type) {
      qb.andWhere('insight.type = :type', { type: options.type });
    }

    if (options?.startDate) {
      qb.andWhere('conversation.analyzedAt >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options?.endDate) {
      qb.andWhere('conversation.analyzedAt <= :endDate', {
        endDate: options.endDate,
      });
    }

    const conversations = await qb.getMany();

    // Convert ConversationInsight to ConversationInsightType
    return conversations.flatMap(conv =>
      conv.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: JSON.stringify(insight.details),
        createdAt: insight.createdAt,
        updatedAt: insight.updatedAt,
      })),
    );
  }

  private extractTopIntents(conversations: Conversation[]): TopIntent[] {
    const intents = conversations.flatMap(conv =>
      conv.insights.filter(insight => insight.type === 'intent'),
    );

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

  private extractTopTopics(conversations: Conversation[]): TopTopic[] {
    const topics = conversations.flatMap(conv =>
      conv.insights.filter(insight => insight.type === 'topic'),
    );

    interface TopicAccumulator {
      [key: string]: { count: number; totalRelevance: number };
    }

    const topicMap = topics.reduce<TopicAccumulator>((acc, topic) => {
      const key = topic.category;
      if (!acc[key]) {
        acc[key] = { count: 0, totalRelevance: 0 };
      }
      acc[key].count++;
      acc[key].totalRelevance += topic.confidence;
      return acc;
    }, {});

    return Object.entries(topicMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        averageRelevance: data.totalRelevance / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractCommonActions(
    conversations: Conversation[],
  ): { type: string; count: number; averageConfidence: number }[] {
    const actions = conversations.flatMap(conv =>
      conv.insights.filter(insight => insight.type === 'action'),
    );

    interface ActionAccumulator {
      [key: string]: { count: number; totalConfidence: number };
    }

    const actionMap = actions.reduce<ActionAccumulator>((acc, action) => {
      const key = action.category;
      if (!acc[key]) {
        acc[key] = { count: 0, totalConfidence: 0 };
      }
      acc[key].count++;
      acc[key].totalConfidence += action.confidence;
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
