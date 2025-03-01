import { EntityRepository, Repository, Between } from 'typeorm';
import { MentionEntity } from '../entities/mention.entity';

@EntityRepository(MentionEntity)
export class MentionRepository extends Repository<MentionEntity> {
  /**
   * Count mentions by competitor
   * @param competitorId The competitor ID
   * @param startDate Optional start date for filtering
   * @param endDate Optional end date for filtering
   * @returns The number of mentions
   */
  async countByCompetitor(
    competitorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const query = this.createQueryBuilder('mention').where(
      'mention.competitorId = :competitorId',
      { competitorId },
    );

    if (startDate && endDate) {
      query.andWhere('mention.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    return query.getCount();
  }

  /**
   * Find mentions by competitor
   * @param competitorId The competitor ID
   * @param limit Maximum number of mentions to return
   * @param offset Number of mentions to skip
   * @returns List of mentions
   */
  async findByCompetitor(
    competitorId: string,
    limit = 10,
    offset = 0,
  ): Promise<MentionEntity[]> {
    return this.createQueryBuilder('mention')
      .leftJoinAndSelect('mention.response', 'response')
      .leftJoinAndSelect('response.query', 'query')
      .where('mention.competitorId = :competitorId', { competitorId })
      .orderBy('mention.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  /**
   * Find mentions by sentiment
   * @param sentiment The sentiment label (positive, negative, neutral)
   * @param limit Maximum number of mentions to return
   * @param offset Number of mentions to skip
   * @returns List of mentions
   */
  async findBySentiment(
    sentiment: string,
    limit = 10,
    offset = 0,
  ): Promise<MentionEntity[]> {
    return this.find({
      where: { sentimentLabel: sentiment },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['competitor', 'response', 'response.query'],
    });
  }

  /**
   * Find mentions with associated features
   * @param features Array of features to search for
   * @param limit Maximum number of mentions to return
   * @param offset Number of mentions to skip
   * @returns List of mentions
   */
  async findByFeatures(
    features: string[],
    limit = 10,
    offset = 0,
  ): Promise<MentionEntity[]> {
    const query = this.createQueryBuilder('mention');

    features.forEach((feature, index) => {
      query.orWhere(`mention.associatedFeatures @> ARRAY[:feature${index}]`, {
        [`feature${index}`]: feature,
      });
    });

    return query
      .orderBy('mention.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  /**
   * Get mention statistics by time period
   * @param startDate Start date for the period
   * @param endDate End date for the period
   * @returns Statistics object with counts by competitor
   */
  async getStatsByTimePeriod(
    startDate: Date,
    endDate: Date,
  ): Promise<Record<string, number>> {
    const mentions = await this.createQueryBuilder('mention')
      .select('mention.competitorId', 'competitorId')
      .addSelect('COUNT(*)', 'count')
      .where('mention.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('mention.competitorId')
      .getRawMany();

    return mentions.reduce((acc, curr) => {
      acc[curr.competitorId] = parseInt(curr.count, 10);
      return acc;
    }, {});
  }
}
