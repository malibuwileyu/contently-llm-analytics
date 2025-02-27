import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';

/**
 * Repository for conversation entities
 */
@Injectable()
export class ConversationRepository extends Repository<Conversation> {
  constructor(private dataSource: DataSource) {
    super(Conversation, dataSource.createEntityManager());
  }

  /**
   * Find a conversation with its insights
   * @param id ID of the conversation
   * @returns Conversation with insights
   */
  async findWithInsights(id: string): Promise<Conversation | null> {
    return this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.insights', 'insights')
      .where('conversation.id = :id', { id })
      .getOne();
  }

  /**
   * Find conversations by brand ID
   * @param brandId ID of the brand
   * @param options Query options
   * @returns Array of conversations
   */
  async findByBrandId(
    brandId: string,
    options?: FindManyOptions<Conversation>
  ): Promise<Conversation[]> {
    return this.find({
      where: { brandId },
      ...options
    });
  }

  /**
   * Get engagement trend for a brand
   * @param brandId ID of the brand
   * @param startDate Start date for the trend
   * @param endDate End date for the trend
   * @returns Array of engagement trend data points
   */
  async getEngagementTrend(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: Date; averageEngagement: number }>> {
    const result = await this.createQueryBuilder('conversation')
      .select('DATE(conversation.analyzed_at)', 'date')
      .addSelect('AVG(conversation.engagement_score)', 'averageEngagement')
      .where('conversation.brand_id = :brandId', { brandId })
      .andWhere('conversation.analyzed_at >= :startDate', { startDate })
      .andWhere('conversation.analyzed_at <= :endDate', { endDate })
      .groupBy('DATE(conversation.analyzed_at)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return result.map(item => ({
      date: new Date(item.date),
      averageEngagement: parseFloat(item.averageEngagement)
    }));
  }
} 