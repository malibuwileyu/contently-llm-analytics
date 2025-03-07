import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsResult } from '../entities/analytics-result.entity';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { PerplexityService } from './perplexity.service';
import { ComparativeQueryService } from './comparative-query.service';
import { Between } from 'typeorm';
import { In } from 'typeorm';
import { CustomerResearchService } from '../../modules/brand-analytics/services/customer-research.service';

interface AnalyticsMetrics {
  mentionCount: number;
  prominenceScore: number;
  sentimentScore: number;
  relevanceScore: number;
  contextScore: number;
}

interface ContextData {
  coreOfferingMatch: number;
  approachRelevance: number;
  technologyAlignment: number;
  segmentFit: number;
  valuePropMatch: number;
}

interface CompetitiveData {
  competitorMentions: Array<{
    name: string;
    count: number;
    sentiment: number;
  }>;
  marketPosition: number;
  relativeStrength: number;
}

interface IndustryData {
  totalMentions: number;
  averageProminence: number;
  competitorStats: Array<{
    name: string;
    mentions: number;
    prominence: number;
  }>;
  trends: {
    growth: number;
    stability: number;
  };
}

interface VisibilityAnalysis {
  industryData: IndustryData;
  competitorVisibility: {
    mentions: number;
    prominence: number;
    ranking: number;
  };
  trends: {
    weeklyGrowth: number;
    monthlyGrowth: number;
    stability: number;
  };
  recommendations: string[];
}

@Injectable()
export class VisibilityAnalyticsService {
  constructor(
    @InjectRepository(AnalyticsResult)
    private readonly analyticsRepository: Repository<AnalyticsResult>,
    private readonly perplexityService: PerplexityService,
    private readonly comparativeQueryService: ComparativeQueryService,
    private readonly customerResearchService: CustomerResearchService,
  ) {}

  async processQueryResponse(
    company: CompetitorEntity,
    queryType: 'industry' | 'context' | 'competitive',
    query: string,
    response: string,
  ): Promise<AnalyticsResult> {
    const startTime = Date.now();

    // Get company profile for context analysis
    const profile =
      await this.perplexityService.generateCompanyProfile(company);

    // Calculate base metrics
    const metrics = await this.calculateBaseMetrics(response, company);

    // Calculate type-specific data
    const contextData =
      queryType === 'context'
        ? await this.calculateContextData(response, profile)
        : null;

    const competitiveData =
      queryType === 'competitive'
        ? await this.calculateCompetitiveData(response, company)
        : null;

    // Create analytics result
    const result = this.analyticsRepository.create({
      companyId: company.id,
      queryType: queryType,
      queryText: query,
      responseText: response,
      mentionCount: metrics.mentionCount,
      prominenceScore: metrics.prominenceScore,
      sentimentScore: metrics.sentimentScore,
      relevanceScore: metrics.relevanceScore,
      contextScore: metrics.contextScore,
      visibilityScore: metrics.prominenceScore,
      authorityScore: metrics.contextScore,
      citationFrequency: 0,
      categoryLeadership: '',
      competitorProximity: [],
      knowledgeBaseMetrics: {
        knowledgeBaseStrength: metrics.relevanceScore,
        contextualAuthority: metrics.contextScore,
        topicalLeadership: [],
      },
      trends: {
        visibilityTrend: 'stable',
        rankingStability: 1.0,
        competitorDynamics: 'neutral',
      },
      responseMetadata: {
        model: 'gpt-4',
        tokens: response.split(/\s+/).length,
        processingTime: Date.now() - startTime,
      },
      timestamp: new Date(),
      metadata: {
        version: '1.0.0',
        batchId: Date.now().toString(),
        queryType: queryType,
        index: 0,
      },
      analysis: {
        question: query,
        aiResponse: {
          content: response,
          metadata: {
            model: 'gpt-4',
            tokens: response.split(/\s+/).length,
          },
        },
        brandHealth: {
          visibilityMetrics: {
            overallVisibility: metrics.prominenceScore,
            categoryRankings: {},
            competitorComparison: {},
          },
          llmPresence: {
            knowledgeBaseStrength: metrics.relevanceScore,
            contextualAuthority: metrics.contextScore,
            topicalLeadership: [],
          },
          trendsOverTime: {
            visibilityTrend: 'stable',
            rankingStability: 1.0,
            competitorDynamics: 'neutral',
          },
        },
        brandMentions: [],
        metrics: {
          visibilityStats: {
            prominenceScore: metrics.prominenceScore,
          },
        },
      },
    });

    return this.analyticsRepository.save(result);
  }

  private async calculateBaseMetrics(
    response: string,
    company: CompetitorEntity,
  ): Promise<AnalyticsMetrics> {
    // First, analyze the response for mentions and their positions
    const mentions = this.analyzeMentions(response, company.name);

    // Calculate prominence score based on mentions and positions
    const prominenceScore = this.calculateProminenceScore(
      mentions.count,
      mentions.positions,
      response.length,
    );

    const prompt = `
      Analyze this response and calculate visibility metrics:
      Response: "${response}"

      Company Profile:
      ${JSON.stringify(company, null, 2)}

      Calculate and return these metrics (0-100):
      {
        "sentiment_score": number (overall sentiment),
        "relevance_score": number (relevance to company profile),
        "context_score": number (contextual understanding shown)
      }
    `;

    const completion = await this.perplexityService[
      'openai'
    ].chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a visibility metrics expert. Calculate accurate visibility scores. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const metrics = JSON.parse(completion.choices[0].message.content);
    return {
      mentionCount: mentions.count,
      prominenceScore: prominenceScore,
      sentimentScore: metrics.sentiment_score,
      relevanceScore: metrics.relevance_score,
      contextScore: metrics.context_score,
    };
  }

  private async calculateContextData(
    response: string,
    profile: any,
  ): Promise<ContextData> {
    const prompt = `
      Analyze the response's alignment with the company profile:
      Response: "${response}"

      Profile:
      ${JSON.stringify(profile, null, 2)}

      Calculate alignment scores (0-100) as:
      {
        "core_offering_match": number,
        "approach_relevance": number,
        "technology_alignment": number,
        "segment_fit": number,
        "value_prop_match": number
      }
    `;

    const completion = await this.perplexityService[
      'openai'
    ].chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a context analysis expert. Calculate alignment scores between responses and company profiles. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  private async calculateCompetitiveData(
    response: string,
    company: CompetitorEntity,
  ): Promise<CompetitiveData> {
    // Get competitive landscape
    const landscape =
      await this.comparativeQueryService[
        'competitorAnalysisService'
      ].generateCompetitiveLandscape(company);

    // Analyze competitor mentions
    const competitors = [
      ...landscape.directCompetitors.map(c => c.competitor),
      ...landscape.indirectCompetitors.map(c => c.competitor),
    ];

    const mentions =
      await this.comparativeQueryService.analyzeCompetitorMentions(
        response,
        competitors,
      );

    // Calculate market position and relative strength
    const competitorStats =
      await this.comparativeQueryService.calculateCompetitivePosition(
        mentions,
        1, // Single response analysis
      );

    const competitorMentions = Object.entries(competitorStats).map(
      ([name, stats]) => ({
        name,
        count: stats.mentionCount,
        sentiment: stats.averageSentiment,
      }),
    );

    // Calculate relative metrics
    const marketPosition = await this.calculateMarketPosition(
      competitorStats,
      company.name,
    );
    const relativeStrength = await this.calculateRelativeStrength(
      response,
      landscape,
    );

    return {
      competitorMentions,
      marketPosition,
      relativeStrength,
    };
  }

  private async calculateMarketPosition(
    stats: Record<string, any>,
    companyName: string,
  ): Promise<number> {
    const companies = Object.keys(stats);
    const positions = companies.map(name => ({
      name,
      score:
        (stats[name].mentionCount * 0.3 +
          stats[name].averagePosition * 0.4 +
          ((stats[name].averageSentiment + 1) / 2) * 0.3) *
        100,
    }));

    positions.sort((a, b) => b.score - a.score);
    const companyIndex = positions.findIndex(p => p.name === companyName);

    return companyIndex === -1
      ? 0
      : 100 * (1 - companyIndex / positions.length);
  }

  private async calculateRelativeStrength(
    response: string,
    landscape: any,
  ): Promise<number> {
    const prompt = `
      Analyze this response for relative competitive strength:
      "${response}"

      Competitive Landscape:
      ${JSON.stringify(landscape, null, 2)}

      Calculate a relative strength score (0-100) considering:
      1. Competitive advantages mentioned
      2. Market position strength
      3. Technology leadership
      4. Customer segment dominance

      Return the score as:
      {
        "relative_strength": number
      }
    `;

    const completion = await this.perplexityService[
      'openai'
    ].chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a competitive analysis expert. Calculate relative strength scores based on market responses. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return JSON.parse(completion.choices[0].message.content).relativeStrength;
  }

  async getVisibilityTrends(
    company: CompetitorEntity,
    timeframe: { start: Date; end: Date },
  ): Promise<any> {
    return this.analyticsRepository
      .createQueryBuilder('ar')
      .select([
        'ar.queryType',
        "DATE_TRUNC('day', ar.createdAt) as date",
        'AVG(ar.mentionCount) as avg_mentions',
        'AVG(ar.prominenceScore) as avg_prominence',
        'AVG(ar.sentimentScore) as avg_sentiment',
        'AVG(ar.relevanceScore) as avg_relevance',
        'AVG(ar.contextScore) as avg_context',
      ])
      .where('ar.companyId = :companyId', { companyId: company.id })
      .andWhere('ar.createdAt BETWEEN :start AND :end', timeframe)
      .groupBy("ar.queryType, DATE_TRUNC('day', ar.createdAt)")
      .orderBy("DATE_TRUNC('day', ar.createdAt)", 'ASC')
      .getRawMany();
  }

  async exportAnalyticsToFile(
    company: CompetitorEntity,
    timeframe: { start: Date; end: Date },
    outputPath: string,
  ): Promise<void> {
    // Get all analytics results for the company
    const results = await this.analyticsRepository.find({
      where: {
        companyId: company.id,
        createdAt: Between(timeframe.start, timeframe.end),
      },
      order: {
        createdAt: 'ASC',
      },
    });

    // Get visibility trends
    const trends = await this.getVisibilityTrends(company, timeframe);

    // Prepare export data
    const exportData = {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry?.name,
      },
      timeframe: {
        start: timeframe.start,
        end: timeframe.end,
      },
      analytics_results: results,
      visibility_trends: trends,
      summary: {
        totalQueries: results.length,
        averageMetrics: {
          mentionCount: this.calculateAverage(results, 'mentionCount'),
          prominenceScore: this.calculateAverage(results, 'prominenceScore'),
          sentimentScore: this.calculateAverage(results, 'sentimentScore'),
          relevanceScore: this.calculateAverage(results, 'relevanceScore'),
          contextScore: this.calculateAverage(results, 'contextScore'),
        },
        queryTypeDistribution: this.calculateQueryDistribution(results),
        generatedAt: new Date().toISOString(),
      },
    };

    // Write to file
    const fs = require('fs');
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(exportData, null, 2),
      'utf8',
    );
  }

  private calculateAverage(results: AnalyticsResult[], field: string): number {
    const values = results
      .map(r => r[field])
      .filter(v => v !== null && v !== undefined);
    return values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;
  }

  private calculateQueryDistribution(
    results: AnalyticsResult[],
  ): Record<string, number> {
    const distribution = results.reduce(
      (acc, result) => {
        acc[result.queryType] = (acc[result.queryType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Convert to percentages
    const total = results.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = (distribution[key] / total) * 100;
    });

    return distribution;
  }

  private analyzeMentions(
    text: string,
    companyName: string,
  ): { count: number; positions: number[] } {
    const words = text.split(/\s+/);
    const positions: number[] = [];
    let count = 0;

    // Look for exact matches and common variations
    const patterns = [
      companyName,
      companyName.toLowerCase(),
      companyName.toUpperCase(),
      `${companyName}'s`,
      `${companyName.toLowerCase()}'s`,
    ];

    words.forEach((word, index) => {
      if (patterns.some(pattern => word.includes(pattern))) {
        count++;
        positions.push(index);
      }
    });

    return { count, positions };
  }

  private calculateProminenceScore(
    mentions: number,
    positions: number[],
    totalLength: number,
  ): number {
    if (mentions === 0) return 0;

    // Base score from mention count (logarithmic scaling)
    // log10(101) ≈ 2, so multiply by 25 to get max 50 points from mentions
    const mentionScore = Math.min(Math.log10(mentions + 1) * 25, 50);

    // Position score (earlier mentions = higher score)
    // Calculate average position score, where earlier positions get higher scores
    const positionScore =
      positions.reduce((acc, pos) => {
        // Earlier positions get higher scores
        const positionWeight = Math.max(0, 100 - (pos / totalLength) * 100);
        return acc + positionWeight;
      }, 0) / positions.length;

    // Normalize position score to 0-50 range
    const normalizedPositionScore = (positionScore / 100) * 50;

    // Final score combines mention frequency and position importance
    return Math.min(mentionScore + normalizedPositionScore, 100);
  }

  async analyzeVisibility(
    competitor: CompetitorEntity,
  ): Promise<VisibilityAnalysis> {
    // Get industry data
    const industryData = await this.getIndustryData(competitor);

    // Get competitor's recent analytics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const competitorAnalytics = await this.analyticsRepository.find({
      where: {
        companyId: competitor.id,
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    // Calculate competitor visibility metrics
    const mentions = competitorAnalytics.reduce(
      (sum, a) => sum + a.mentionCount,
      0,
    );
    const prominence =
      competitorAnalytics.reduce((sum, a) => sum + a.prominenceScore, 0) /
      (competitorAnalytics.length || 1);

    // Calculate ranking
    const sortedCompetitors = [...industryData.competitorStats].sort(
      (a, b) => b.prominence - a.prominence,
    );
    const ranking =
      sortedCompetitors.findIndex(c => c.name === competitor.name) + 1;

    // Calculate trends
    const weeklyGrowth = await this.calculateCompetitorGrowth(
      competitorAnalytics,
      7,
    );
    const monthlyGrowth = await this.calculateCompetitorGrowth(
      competitorAnalytics,
      30,
    );
    const stability =
      await this.calculateIndustryStability(competitorAnalytics);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      competitor,
      { mentions, prominence, ranking },
      industryData,
    );

    return {
      industryData,
      competitorVisibility: {
        mentions,
        prominence,
        ranking,
      },
      trends: {
        weeklyGrowth,
        monthlyGrowth,
        stability,
      },
      recommendations,
    };
  }

  private async calculateCompetitorGrowth(
    analytics: AnalyticsResult[],
    days: number,
  ): Promise<number> {
    if (analytics.length < 2) return 0;

    const sortedAnalytics = analytics.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const periodAnalytics = sortedAnalytics.slice(-days);

    if (periodAnalytics.length < 2) return 0;

    const firstScore = periodAnalytics[0].visibilityScore;
    const lastScore =
      periodAnalytics[periodAnalytics.length - 1].visibilityScore;

    return ((lastScore - firstScore) / firstScore) * 100;
  }

  private async generateRecommendations(
    competitor: CompetitorEntity,
    visibility: { mentions: number; prominence: number; ranking: number },
    industryData: IndustryData,
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Compare to industry averages
    if (
      visibility.mentions <
      industryData.totalMentions / industryData.competitorStats.length
    ) {
      recommendations.push(
        'Increase brand presence through more frequent content creation and distribution',
      );
    }

    if (visibility.prominence < industryData.averageProminence) {
      recommendations.push(
        'Improve content quality and relevance to boost prominence in industry discussions',
      );
    }

    if (
      visibility.ranking > Math.ceil(industryData.competitorStats.length / 2)
    ) {
      recommendations.push(
        'Focus on competitive differentiation to improve industry ranking',
      );
    }

    // Add general recommendations
    recommendations.push(
      'Maintain consistent brand messaging across all channels',
    );
    recommendations.push(
      'Monitor and engage with industry trends and discussions',
    );

    return recommendations;
  }

  async getVisibilityHistory(
    company: CompetitorEntity,
  ): Promise<AnalyticsResult[]> {
    return this.analyticsRepository.find({
      where: { companyId: company.id },
      order: { createdAt: 'ASC' },
    });
  }

  private async getIndustryData(
    competitor: CompetitorEntity,
  ): Promise<IndustryData> {
    // Get all competitors in the same industry
    const competitors =
      await this.customerResearchService.getCompetitorsByIndustry(
        competitor.industryId,
      );

    // Get analytics for all competitors in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allAnalytics = await this.analyticsRepository.find({
      where: {
        companyId: In(competitors.map(c => c.id)),
        createdAt: Between(thirtyDaysAgo, new Date()),
      },
    });

    // Calculate industry stats
    const competitorStats = competitors.map(comp => {
      const analytics = allAnalytics.filter(a => a.companyId === comp.id);
      return {
        name: comp.name,
        mentions: analytics.reduce((sum, a) => sum + a.mentionCount, 0),
        prominence:
          analytics.reduce((sum, a) => sum + a.prominenceScore, 0) /
          (analytics.length || 1),
      };
    });

    const totalMentions = competitorStats.reduce(
      (sum, stat) => sum + stat.mentions,
      0,
    );
    const averageProminence =
      competitorStats.reduce((sum, stat) => sum + stat.prominence, 0) /
      competitorStats.length;

    // Calculate trends
    const growth = await this.calculateIndustryGrowth(allAnalytics);
    const stability = await this.calculateIndustryStability(allAnalytics);

    return {
      totalMentions,
      averageProminence,
      competitorStats,
      trends: {
        growth,
        stability,
      },
    };
  }

  private async calculateIndustryGrowth(
    analytics: AnalyticsResult[],
  ): Promise<number> {
    if (analytics.length < 2) return 0;

    const sortedAnalytics = analytics.sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const firstWeekAnalytics = sortedAnalytics.slice(
      0,
      Math.floor(sortedAnalytics.length / 4),
    );
    const lastWeekAnalytics = sortedAnalytics.slice(
      -Math.floor(sortedAnalytics.length / 4),
    );

    const firstWeekAvg =
      firstWeekAnalytics.reduce((sum, a) => sum + a.visibilityScore, 0) /
      firstWeekAnalytics.length;
    const lastWeekAvg =
      lastWeekAnalytics.reduce((sum, a) => sum + a.visibilityScore, 0) /
      lastWeekAnalytics.length;

    return ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
  }

  private async calculateIndustryStability(
    analytics: AnalyticsResult[],
  ): Promise<number> {
    if (analytics.length < 2) return 1;

    const scores = analytics.map(a => a.visibilityScore);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;

    // Convert variance to stability score (0-1)
    // Lower variance means higher stability
    return Math.max(0, 1 - Math.sqrt(variance) / mean);
  }
}
