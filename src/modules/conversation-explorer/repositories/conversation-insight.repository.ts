import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConversationInsight } from '../entities/conversation-insight.entity';

/**
 * Interface for insight search options
 */
export interface InsightSearchOptions {
  brandId: string;
  type?: string;
  category?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

/**
 * Repository for conversation insight entities
 */
@Injectable()
export class ConversationInsightRepository extends Repository<ConversationInsight> {
  constructor(private dataSource: DataSource) {
    super(ConversationInsight, dataSource.createEntityManager());
  }

  /**
   * Find insights by conversation ID
   * @param conversationId ID of the conversation
   * @param options Query options
   * @returns Array of insights
   */
  async findByConversationId(
    conversationId: string,
    options?: FindManyOptions<ConversationInsight>
  ): Promise<ConversationInsight[]> {
    return this.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      ...options
    });
  }

  /**
   * Find insights by type
   * @param type Type of insight
   * @param options Query options
   * @returns Array of insights
   */
  async findByType(
    type: string,
    options?: FindManyOptions<ConversationInsight>
  ): Promise<ConversationInsight[]> {
    return this.find({
      where: { type },
      order: { confidence: 'DESC' },
      take: 10,
      ...options
    });
  }

  /**
   * Search insights with various filters
   * @param options Search options
   * @returns Array of insights with conversation data
   */
  async searchInsights(options: InsightSearchOptions): Promise<any[]> {
    const query = this.createQueryBuilder('insight')
      .innerJoin('insight.conversation', 'conversation')
      .where('conversation.brand_id = :brandId', { brandId: options.brandId });

    if (options.type) {
      query.andWhere('insight.type = :type', { type: options.type });
    }

    if (options.category) {
      query.andWhere('insight.category = :category', { category: options.category });
    }

    if (options.minConfidence) {
      query.andWhere('insight.confidence >= :minConfidence', { minConfidence: options.minConfidence });
    }

    query.orderBy('insight.confidence', 'DESC');

    if (options.limit) {
      query.take(options.limit);
    }

    if (options.offset) {
      query.skip(options.offset);
    }

    const insights = await query.getMany();

    return insights.map(insight => ({
      id: insight.id,
      conversationId: insight.conversationId,
      type: insight.type,
      category: insight.category,
      confidence: insight.confidence,
      ...insight.details
    }));
  }

  /**
   * Get top insights by type
   * @param brandId ID of the brand
   * @param type Type of insight
   * @param limit Maximum number of results
   * @returns Array of aggregated insights
   */
  async getTopInsightsByType(
    brandId: string,
    type: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await this.createQueryBuilder('insight')
      .select('insight.category', 'category')
      .addSelect('COUNT(insight.id)', 'count')
      .addSelect('AVG(insight.confidence)', 'averageConfidence')
      .innerJoin('insight.conversation', 'conversation')
      .where('conversation.brand_id = :brandId', { brandId })
      .andWhere('insight.type = :type', { type })
      .groupBy('insight.category')
      .orderBy('count', 'DESC')
      .addOrderBy('averageConfidence', 'DESC')
      .take(limit)
      .getRawMany();

    return result.map(item => ({
      category: item.category,
      count: parseInt(item.count, 10),
      averageConfidence: parseFloat(item.averageConfidence)
    }));
  }
} 