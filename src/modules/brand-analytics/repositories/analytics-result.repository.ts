import { EntityRepository, Repository } from 'typeorm';
import { AnalyticsResultEntity } from '../entities/analytics-result.entity';

@EntityRepository(AnalyticsResultEntity)
export class AnalyticsResultRepository extends Repository<AnalyticsResultEntity> {
  /**
   * Find analytics results by business category and type
   * @param businessCategoryId The business category ID
   * @param type The analytics type (e.g., mention_frequency)
   * @param timeFrame The time frame (e.g., daily, weekly, monthly)
   * @returns List of analytics results
   */
  async findByCategoryAndType(
    businessCategoryId: string,
    type: string,
    timeFrame: string,
  ): Promise<AnalyticsResultEntity[]> {
    return this.find({
      where: {
        businessCategoryId,
        type,
        timeFrame,
      },
      order: {
        rank: 'ASC',
        value: 'DESC',
      },
      relations: ['competitor'],
    });
  }

  /**
   * Find analytics results for a specific competitor
   * @param competitorId The competitor ID
   * @param type The analytics type (e.g., mention_frequency)
   * @returns List of analytics results
   */
  async findByCompetitor(
    competitorId: string,
    type: string,
  ): Promise<AnalyticsResultEntity[]> {
    return this.find({
      where: {
        competitorId,
        type,
      },
      order: {
        startDate: 'DESC',
      },
    });
  }

  /**
   * Find the latest analytics results for a business category
   * @param businessCategoryId The business category ID
   * @param type The analytics type (e.g., mention_frequency)
   * @param timeFrame The time frame (e.g., daily, weekly, monthly)
   * @returns The latest analytics results
   */
  async findLatestByCategoryAndType(
    businessCategoryId: string,
    type: string,
    timeFrame: string,
  ): Promise<AnalyticsResultEntity[]> {
    // First, find the latest date for this category, type, and time frame
    const latestResult = await this.createQueryBuilder('result')
      .select('MAX(result.endDate)', 'maxDate')
      .where('result.businessCategoryId = :businessCategoryId', {
        businessCategoryId,
      })
      .andWhere('result.type = :type', { type })
      .andWhere('result.timeFrame = :timeFrame', { timeFrame })
      .getRawOne();

    if (!latestResult || !latestResult.maxDate) {
      return [];
    }

    // Then, find all results for that date
    return this.find({
      where: {
        businessCategoryId,
        type,
        timeFrame,
        endDate: latestResult.maxDate,
      },
      order: {
        rank: 'ASC',
      },
      relations: ['competitor'],
    });
  }

  /**
   * Find time series data for a competitor
   * @param competitorId The competitor ID
   * @param type The analytics type (e.g., mention_frequency)
   * @param timeFrame The time frame (e.g., daily, weekly, monthly)
   * @param limit Maximum number of results to return
   * @returns List of analytics results ordered by date
   */
  async findTimeSeriesForCompetitor(
    competitorId: string,
    type: string,
    timeFrame: string,
    limit = 30,
  ): Promise<AnalyticsResultEntity[]> {
    return this.find({
      where: {
        competitorId,
        type,
        timeFrame,
      },
      order: {
        endDate: 'DESC',
      },
      take: limit,
    });
  }
}
