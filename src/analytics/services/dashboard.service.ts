import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { AnalyticsResultRepository } from '../repositories/analytics-result.repository';

export interface BrandVisibilityStats {
  totalMentions: number;
  totalRecords: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  sentimentScore: number;
  topSources: Array<{ source: string; count: number }>;
  reachMetrics: {
    totalReach: number;
    averageReach: number;
    peakReach: number;
  };
  weeklyData: Array<{
    weekStart: string;  // ISO date string
    weekEnd: string;    // ISO date string
    totalMentions: number;
    mentions: number;
    sentiment: number;
    reach: number;
    queryTypes: {
      industry: number;
      context: number;
      freeform: number;
    };
  }>;
}

export interface DashboardOverview {
  customers: Array<{
    id: string;
    name: string;
    stats: BrandVisibilityStats;
  }>;
  totalCustomers: number;
  totalAnalyses: number;
  averageSentiment: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly analyticsResultRepo: AnalyticsResultRepository,
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepo: Repository<CompetitorEntity>
  ) {}

  async getDashboardOverview(): Promise<DashboardOverview> {
    try {
      // Get all customers (competitors with isCustomer=true)
      const customers = await this.competitorRepo.find({
        where: { isCustomer: true, isActive: true }
      });
      const totalCustomers = customers.length;

      // Get analytics results for all customers
      const customerStats = await Promise.all(
        customers.map(async (customer) => {
          const stats = await this.getCustomerStats(customer.id);
          return {
            id: customer.id,
            name: customer.name,
            stats
          };
        })
      );

      // Calculate overall metrics
      const totalAnalyses = customerStats.reduce(
        (sum, customer) => sum + customer.stats.totalMentions,
        0
      );

      const averageSentiment =
        customerStats.reduce(
          (sum, customer) => sum + customer.stats.sentimentScore,
          0
        ) / totalCustomers || 0;

      return {
        customers: customerStats,
        totalCustomers,
        totalAnalyses,
        averageSentiment
      };
    } catch (error) {
      this.logger.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  async getCustomerStats(companyId: string): Promise<BrandVisibilityStats> {
    // Get data from last 90 days only
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of current day
    
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setDate(now.getDate() - 90);
    threeMonthsAgo.setHours(0, 0, 0, 0); // Start of day
    
    // Find the start of the week containing threeMonthsAgo
    const weekStart = new Date(threeMonthsAgo);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    
    // Initialize all weeks in the 3-month period
    const weeklyMap = new Map<string, {
      weekStart: Date;
      weekEnd: Date;
      mentions: number;
      totalMentions: number;
      sentiment: number;
      reach: number;
      queryTypes: {
        industry: number;
        context: number;
        freeform: number;
      };
    }>();

    // Pre-populate all weeks from the start of the week containing threeMonthsAgo to now
    let currentDate = new Date(weekStart);
    while (currentDate <= now) {
      const currentWeekStart = new Date(currentDate);
      currentWeekStart.setHours(0, 0, 0, 0);
      
      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of week (Saturday)
      currentWeekEnd.setHours(23, 59, 59, 999);

      const weekKey = currentWeekStart.toISOString();
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          weekStart: currentWeekStart,
          weekEnd: currentWeekEnd,
          mentions: 0,
          totalMentions: 0,
          sentiment: 0,
          reach: 0,
          queryTypes: {
            industry: 0,
            context: 0,
            freeform: 0
          }
        });
      }

      currentDate.setDate(currentDate.getDate() + 7);
    }
    
    // Get all records for total count within time range
    const allResults = await this.analyticsResultRepo
      .createQueryBuilder('result')
      .where('result.company_id = :companyId', { companyId })
      .andWhere('result.timestamp >= :startDate', { startDate: weekStart })
      .andWhere('result.timestamp <= :endDate', { endDate: now })
      .orderBy('result.timestamp', 'DESC')
      .getMany();

    // Get filtered results for mentions
    const results = await this.analyticsResultRepo.findLatestByCustomerId(companyId);

    const stats: BrandVisibilityStats = {
      totalMentions: 0,
      totalRecords: allResults.length,
      positiveMentions: 0,
      negativeMentions: 0,
      neutralMentions: 0,
      sentimentScore: 0,
      topSources: [],
      reachMetrics: {
        totalReach: 0,
        averageReach: 0,
        peakReach: 0
      },
      weeklyData: []
    };

    if (results.length === 0) {
      // Even if no results, return the empty weeks
      stats.weeklyData = Array.from(weeklyMap.values()).map(data => ({
        weekStart: data.weekStart.toISOString(),
        weekEnd: data.weekEnd.toISOString(),
        totalMentions: 0,
        mentions: 0,
        sentiment: 0,
        reach: 0,
        queryTypes: data.queryTypes
      }));
      return stats;
    }

    const sourceMap = new Map<string, number>();

    // Process all results into weekly buckets
    allResults.forEach(result => {
      const resultDate = new Date(result.timestamp);
      const weekStart = new Date(resultDate);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);
      
      const weekKey = weekStart.toISOString();
      const existing = weeklyMap.get(weekKey);
      
      if (existing) {
        // Update query type counts
        existing.queryTypes[result.queryType as keyof typeof existing.queryTypes]++;
        existing.totalMentions++;

        if (result.mentionCount === 1) {
          existing.mentions++;
          
          const sentiment = result.sentimentScore || 0;
          existing.sentiment += sentiment;

          if (sentiment > 0.6) stats.positiveMentions++;
          else if (sentiment < 0.4) stats.negativeMentions++;
          else stats.neutralMentions++;

          // Track sources
          const source = result.analysis.brandMentions[0]?.knowledgeBaseMetrics.categoryLeadership || 'unknown';
          sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

          // Calculate reach
          const reach = this.calculateReachScore(result);
          existing.reach = Math.max(existing.reach, reach);
          stats.reachMetrics.totalReach += reach;
          stats.reachMetrics.peakReach = Math.max(stats.reachMetrics.peakReach, reach);

          stats.totalMentions++;
          stats.sentimentScore += sentiment;
        }
      }
    });

    // Only calculate averages if we have actual mentions
    if (stats.totalMentions > 0) {
      stats.sentimentScore /= stats.totalMentions;
      stats.reachMetrics.averageReach = stats.reachMetrics.totalReach / stats.totalMentions;
    }

    // Sort and limit top sources
    stats.topSources = Array.from(sourceMap.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Convert weekly data and sort by date
    stats.weeklyData = Array.from(weeklyMap.values())
      .map(data => ({
        weekStart: data.weekStart.toISOString(),
        weekEnd: data.weekEnd.toISOString(),
        totalMentions: data.totalMentions,
        mentions: data.mentions,
        sentiment: data.mentions > 0 ? data.sentiment / data.mentions : 0,
        reach: data.reach,
        queryTypes: data.queryTypes
      }))
      .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime()); // Oldest to newest

    return stats;
  }

  /**
   * Calculate a reach score based on multiple metrics
   */
  private calculateReachScore(result: any): number {
    const brandMention = result.analysis.brandMentions[0];
    if (!brandMention) return 0;

    // Base reach from visibility metrics
    const baseReach = result.analysis.brandHealth.visibilityMetrics.overallVisibility * 100;

    // Multiply by authority factor (0.5 to 2.0)
    const authorityFactor = 0.5 + Math.min(brandMention.knowledgeBaseMetrics.authorityScore, 1.5);
    
    // Multiply by citation factor (1.0 to 2.0)
    const citationFactor = 1 + Math.min(brandMention.knowledgeBaseMetrics.citationFrequency / 10, 1);
    
    // Multiply by leadership factor (0.5 to 1.5)
    const leadershipScore = this.convertLeadershipToScore(brandMention.knowledgeBaseMetrics.categoryLeadership);
    const leadershipFactor = 0.5 + leadershipScore;

    // Calculate final reach
    return Math.round(baseReach * authorityFactor * citationFactor * leadershipFactor);
  }

  private convertLeadershipToScore(leadership: string): number {
    // Implement the logic to convert leadership to a score
    // This is a placeholder and should be replaced with the actual implementation
    return 1; // Placeholder return, actual implementation needed
  }
} 