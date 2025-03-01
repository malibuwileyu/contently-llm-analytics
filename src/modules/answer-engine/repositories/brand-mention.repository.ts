import { Injectable } from '@nestjs/common';
import {
  DataSource,
  Repository,
  FindManyOptions,
  EntityNotFoundError,
} from 'typeorm';
import { BrandMention } from '../entities/brand-mention.entity';
import { SentimentTrend } from '../interfaces/sentiment-analysis.interface';

/**
 * Repository for brand mentions
 */
@Injectable()
export class BrandMentionRepository extends Repository<BrandMention> {
  constructor(private dataSource: DataSource) {
    super(BrandMention, dataSource.createEntityManager());
  }

  /**
   * Find brand mentions by brand ID
   * @param brandId ID of the brand
   * @param options Additional find options
   * @returns Array of brand mentions
   */
  async findByBrandId(
    brandId: string,
    options: FindManyOptions<BrandMention>,
  ): Promise<BrandMention[]> {
    return this.find({
      where: { brandId },
      ...options,
    });
  }

  /**
   * Find a brand mention with its citations
   * @param id ID of the brand mention
   * @returns Brand mention with citations
   * @throws EntityNotFoundError if the brand mention is not found
   */
  async findWithCitations(id: string): Promise<BrandMention> {
    const mention = await this.createQueryBuilder('mention')
      .leftJoinAndSelect('mention.citations', 'citations')
      .where('mention.id = :id', { id })
      .getOne();

    if (!mention) {
      throw new EntityNotFoundError(BrandMention, id);
    }

    return mention;
  }

  /**
   * Get sentiment trend for a brand over time
   * @param brandId ID of the brand
   * @param startDate Start date for the trend
   * @param endDate End date for the trend
   * @returns Array of sentiment trend data points
   */
  async getSentimentTrend(
    brandId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SentimentTrend[]> {
    return this.createQueryBuilder('mention')
      .select('DATE(mention.mentionedAt)', 'date')
      .addSelect('AVG(mention.sentiment)', 'averageSentiment')
      .where('mention.brandId = :brandId', { brandId })
      .andWhere('mention.mentionedAt _BETWEEN :startDate _AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(mention.mentionedAt)')
      .orderBy('DATE(mention.mentionedAt)', 'ASC')
      .getRawMany();
  }
}
