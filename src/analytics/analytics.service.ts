import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsResult } from './entities/analytics-result.entity';

interface DailyScores {
  count: number;
  visibility: number;
  prominence: number;
  context: number;
  authority: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsResult)
    private readonly analyticsResultRepository: Repository<AnalyticsResult>
  ) {}

  async getOverview() {
    const results = await this.analyticsResultRepository.find({
      order: {
        createdAt: 'DESC'
      },
      take: 100
    });

    return {
      totalAnalyses: results.length,
      averageScores: {
        visibility: this.calculateAverage(results.map(r => r.visibilityScore)),
        prominence: this.calculateAverage(results.map(r => r.prominenceScore)),
        context: this.calculateAverage(results.map(r => r.contextScore)),
        authority: this.calculateAverage(results.map(r => r.authorityScore))
      },
      recentResults: results.slice(0, 10).map(r => ({
        id: r.id,
        companyId: r.companyId,
        queryText: r.queryText,
        responseText: r.responseText,
        scores: {
          visibility: r.visibilityScore,
          prominence: r.prominenceScore,
          context: r.contextScore,
          authority: r.authorityScore
        },
        analysis: r.analysis,
        metadata: r.metadata,
        createdAt: r.createdAt
      }))
    };
  }

  async getContentAnalytics() {
    const results = await this.analyticsResultRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });

    return {
      contentMetrics: {
        totalContent: results.length,
        byQueryType: this.groupByQueryType(results),
        trends: this.calculateTrends(results)
      }
    };
  }

  async getEngagementAnalytics() {
    const results = await this.analyticsResultRepository.find({
      order: {
        createdAt: 'DESC'
      }
    });

    return {
      engagementMetrics: {
        totalEngagements: results.length,
        averageResponseLength: this.calculateAverage(results.map(r => r.responseText.length)),
        topQueries: this.getTopQueries(results)
      }
    };
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  private groupByQueryType(results: AnalyticsResult[]) {
    return results.reduce((acc, result) => {
      const type = result.queryType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTrends(results: AnalyticsResult[]) {
    // Group by day and calculate average scores
    const dailyScores = results.reduce((acc, result) => {
      const day = result.createdAt.toISOString().split('T')[0];
      if (!acc[day]) {
        acc[day] = {
          count: 0,
          visibility: 0,
          prominence: 0,
          context: 0,
          authority: 0
        };
      }
      acc[day].count++;
      acc[day].visibility += result.visibilityScore;
      acc[day].prominence += result.prominenceScore;
      acc[day].context += result.contextScore;
      acc[day].authority += result.authorityScore;
      return acc;
    }, {} as Record<string, DailyScores>);

    // Calculate averages
    return Object.entries(dailyScores).map(([date, scores]) => ({
      date,
      visibility: scores.visibility / scores.count,
      prominence: scores.prominence / scores.count,
      context: scores.context / scores.count,
      authority: scores.authority / scores.count
    }));
  }

  private getTopQueries(results: AnalyticsResult[]) {
    const queryCount = results.reduce((acc, result) => {
      acc[result.queryText] = (acc[result.queryText] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(queryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }
} 