import { Injectable } from '@nestjs/common';
import { DataSource, Repository, In } from 'typeorm';
import { AnalyticsResult } from '../entities/analytics-result.entity';

@Injectable()
export class AnalyticsResultRepository extends Repository<AnalyticsResult> {
  constructor(private dataSource: DataSource) {
    super(AnalyticsResult, dataSource.createEntityManager());
  }

  async findLatestByCustomerId(companyId: string, limit: number = 400): Promise<AnalyticsResult[]> {
    return this.find({
      where: { companyId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async findByCustomerIds(companyIds: string[]): Promise<AnalyticsResult[]> {
    return this.find({
      where: { companyId: In(companyIds) },
      order: { createdAt: 'DESC' }
    });
  }

  async getCustomerStats(companyId: string): Promise<{
    totalCount: number;
    averageSentiment: number;
  }> {
    const result = await this.createQueryBuilder('result')
      .where('result.companyId = :companyId', { companyId })
      .select([
        'COUNT(*) as totalCount',
        'AVG(result.sentiment) as averageSentiment'
      ])
      .getRawOne();

    return {
      totalCount: parseInt(result.totalCount, 10),
      averageSentiment: parseFloat(result.averageSentiment) || 0
    };
  }
} 