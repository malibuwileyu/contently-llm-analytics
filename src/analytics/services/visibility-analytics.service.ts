import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsResult } from '../entities/analytics-result.entity';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { PerplexityService } from './perplexity.service';
import { ComparativeQueryService } from './comparative-query.service';
import { Between } from 'typeorm';

interface AnalyticsMetrics {
  mention_count: number;
  prominence_score: number;
  sentiment_score: number;
  relevance_score: number;
  context_score: number;
}

interface ContextData {
  core_offering_match: number;
  approach_relevance: number;
  technology_alignment: number;
  segment_fit: number;
  value_prop_match: number;
}

interface CompetitiveData {
  competitor_mentions: Array<{
    name: string;
    count: number;
    sentiment: number;
  }>;
  market_position: number;
  relative_strength: number;
}

@Injectable()
export class VisibilityAnalyticsService {
  constructor(
    @InjectRepository(AnalyticsResult)
    private readonly analyticsRepository: Repository<AnalyticsResult>,
    private readonly perplexityService: PerplexityService,
    private readonly comparativeQueryService: ComparativeQueryService
  ) {}

  async processQueryResponse(
    company: CompetitorEntity,
    queryType: 'industry' | 'context' | 'competitive',
    query: string,
    response: string
  ): Promise<AnalyticsResult> {
    const startTime = Date.now();

    // Get company profile for context analysis
    const profile = await this.perplexityService.generateCompanyProfile(company);

    // Calculate base metrics
    const metrics = await this.calculateBaseMetrics(response, company);

    // Calculate type-specific data
    const contextData = queryType === 'context' ? 
      await this.calculateContextData(response, profile) : null;

    const competitiveData = queryType === 'competitive' ?
      await this.calculateCompetitiveData(response, company) : null;

    // Create analytics result
    const result = this.analyticsRepository.create({
      companyId: company.id,
      query_type: queryType,
      query_text: query,
      response_text: response,
      mention_count: metrics.mention_count,
      prominence_score: metrics.prominence_score,
      sentiment_score: metrics.sentiment_score,
      relevance_score: metrics.relevance_score,
      context_score: metrics.context_score,
      context_data: contextData,
      competitive_data: competitiveData,
      response_metadata: {
        model: 'gpt-4',
        tokens: response.split(/\s+/).length,
        processingTime: Date.now() - startTime
      },
      created_at: new Date(),
      metadata: {
        version: '1.0.0',
        batchId: Date.now().toString(),
        index: 0
      },
      analysis: {
        question: query,
        aiResponse: {
          content: response,
          metadata: {
            model: 'gpt-4',
            tokens: response.split(/\s+/).length,
            rankingData: {
              brandPosition: metrics.prominence_score,
              competitorPositions: competitiveData?.competitor_mentions.reduce((acc, curr) => ({
                ...acc,
                [curr.name]: curr.count
              }), {}) || {}
            }
          }
        },
        brandMentions: [],
        brandHealth: {
          visibilityMetrics: {
            overallVisibility: metrics.prominence_score,
            categoryRankings: {},
            competitorComparison: {}
          },
          llmPresence: {
            knowledgeBaseStrength: metrics.relevance_score,
            contextualAuthority: metrics.context_score,
            topicalLeadership: []
          },
          trendsOverTime: {
            visibilityTrend: 'stable',
            rankingStability: 1.0,
            competitorDynamics: 'neutral'
          }
        },
        citations: [],
        insights: [],
        metrics: {
          visibilityStats: {
            averagePosition: metrics.prominence_score,
            prominenceScore: metrics.prominence_score,
            leadingMentions: String(metrics.mention_count),
            competitorCooccurrence: 'neutral'
          },
          llmPatterns: {
            knowledgeBaseRepresentation: metrics.relevance_score,
            contextualAuthority: metrics.context_score,
            categoryLeadership: {}
          },
          trendsOverTime: {
            visibilityTrend: 'stable',
            positionStability: 'stable',
            contextualEvolution: 'neutral'
          }
        },
        metadata: {
          processingTime: Date.now() - startTime,
          retryCount: 0,
          timestamp: new Date().toISOString()
        }
      }
    });

    return this.analyticsRepository.save(result);
  }

  private async calculateBaseMetrics(
    response: string,
    company: CompetitorEntity
  ): Promise<AnalyticsMetrics> {
    // First, analyze the response for mentions and their positions
    const mentions = this.analyzeMentions(response, company.name);
    
    // Calculate prominence score based on mentions and positions
    const prominenceScore = this.calculateProminenceScore(mentions.count, mentions.positions, response.length);

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

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a visibility metrics expert. Calculate accurate visibility scores. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const metrics = JSON.parse(completion.choices[0].message.content);
    return {
      mention_count: mentions.count,
      prominence_score: prominenceScore,
      sentiment_score: metrics.sentiment_score,
      relevance_score: metrics.relevance_score,
      context_score: metrics.context_score
    };
  }

  private async calculateContextData(
    response: string,
    profile: any
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

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a context analysis expert. Calculate alignment scores between responses and company profiles. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  private async calculateCompetitiveData(
    response: string,
    company: CompetitorEntity
  ): Promise<CompetitiveData> {
    // Get competitive landscape
    const landscape = await this.comparativeQueryService['competitorAnalysisService'].generateCompetitiveLandscape(company);
    
    // Analyze competitor mentions
    const competitors = [
      ...landscape.directCompetitors.map(c => c.competitor),
      ...landscape.indirectCompetitors.map(c => c.competitor)
    ];
    
    const mentions = await this.comparativeQueryService.analyzeCompetitorMentions(
      response,
      competitors
    );

    // Calculate market position and relative strength
    const competitorStats = await this.comparativeQueryService.calculateCompetitivePosition(
      mentions,
      1 // Single response analysis
    );

    const competitor_mentions = Object.entries(competitorStats).map(([name, stats]) => ({
      name,
      count: stats.mentionCount,
      sentiment: stats.averageSentiment
    }));

    // Calculate relative metrics
    const market_position = await this.calculateMarketPosition(competitorStats, company.name);
    const relative_strength = await this.calculateRelativeStrength(response, landscape);

    return {
      competitor_mentions,
      market_position,
      relative_strength
    };
  }

  private async calculateMarketPosition(
    stats: Record<string, any>,
    companyName: string
  ): Promise<number> {
    const companies = Object.keys(stats);
    const positions = companies.map(name => ({
      name,
      score: (
        stats[name].mentionCount * 0.3 +
        stats[name].averagePosition * 0.4 +
        ((stats[name].averageSentiment + 1) / 2) * 0.3
      ) * 100
    }));

    positions.sort((a, b) => b.score - a.score);
    const companyIndex = positions.findIndex(p => p.name === companyName);
    
    return companyIndex === -1 ? 0 : 
      100 * (1 - (companyIndex / positions.length));
  }

  private async calculateRelativeStrength(
    response: string,
    landscape: any
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

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a competitive analysis expert. Calculate relative strength scores based on market responses. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content).relative_strength;
  }

  async getVisibilityTrends(
    company: CompetitorEntity,
    timeframe: { start: Date; end: Date }
  ): Promise<any> {
    return this.analyticsRepository
      .createQueryBuilder('ar')
      .select([
        'ar.query_type',
        'DATE_TRUNC(\'day\', ar.created_at) as date',
        'AVG(ar.mention_count) as avg_mentions',
        'AVG(ar.prominence_score) as avg_prominence',
        'AVG(ar.sentiment_score) as avg_sentiment',
        'AVG(ar.relevance_score) as avg_relevance',
        'AVG(ar.context_score) as avg_context'
      ])
      .where('ar.companyId = :companyId', { companyId: company.id })
      .andWhere('ar.created_at BETWEEN :start AND :end', timeframe)
      .groupBy('ar.query_type, DATE_TRUNC(\'day\', ar.created_at)')
      .orderBy('DATE_TRUNC(\'day\', ar.created_at)', 'ASC')
      .getRawMany();
  }

  async exportAnalyticsToFile(
    company: CompetitorEntity,
    timeframe: { start: Date; end: Date },
    outputPath: string
  ): Promise<void> {
    // Get all analytics results for the company
    const results = await this.analyticsRepository.find({
      where: {
        companyId: company.id,
        created_at: Between(timeframe.start, timeframe.end)
      },
      order: {
        created_at: 'ASC'
      }
    });

    // Get visibility trends
    const trends = await this.getVisibilityTrends(company, timeframe);

    // Prepare export data
    const exportData = {
      company: {
        id: company.id,
        name: company.name,
        industry: company.industry?.name
      },
      timeframe: {
        start: timeframe.start,
        end: timeframe.end
      },
      analytics_results: results,
      visibility_trends: trends,
      summary: {
        total_queries: results.length,
        average_metrics: {
          mention_count: this.calculateAverage(results, 'mention_count'),
          prominence_score: this.calculateAverage(results, 'prominence_score'),
          sentiment_score: this.calculateAverage(results, 'sentiment_score'),
          relevance_score: this.calculateAverage(results, 'relevance_score'),
          context_score: this.calculateAverage(results, 'context_score')
        },
        query_type_distribution: this.calculateQueryDistribution(results),
        generated_at: new Date().toISOString()
      }
    };

    // Write to file
    const fs = require('fs');
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(exportData, null, 2),
      'utf8'
    );
  }

  private calculateAverage(results: AnalyticsResult[], field: string): number {
    const values = results.map(r => r[field]).filter(v => v !== null && v !== undefined);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }

  private calculateQueryDistribution(results: AnalyticsResult[]): Record<string, number> {
    const distribution = results.reduce((acc, result) => {
      acc[result.query_type] = (acc[result.query_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Convert to percentages
    const total = results.length;
    Object.keys(distribution).forEach(key => {
      distribution[key] = (distribution[key] / total) * 100;
    });

    return distribution;
  }

  private analyzeMentions(text: string, companyName: string): { count: number; positions: number[] } {
    const words = text.split(/\s+/);
    const positions: number[] = [];
    let count = 0;

    // Look for exact matches and common variations
    const patterns = [
      companyName,
      companyName.toLowerCase(),
      companyName.toUpperCase(),
      `${companyName}'s`,
      `${companyName.toLowerCase()}'s`
    ];

    words.forEach((word, index) => {
      if (patterns.some(pattern => word.includes(pattern))) {
        count++;
        positions.push(index);
      }
    });

    return { count, positions };
  }

  private calculateProminenceScore(mentions: number, positions: number[], totalLength: number): number {
    if (mentions === 0) return 0;

    // Base score from mention count (logarithmic scaling)
    // log10(101) ≈ 2, so multiply by 25 to get max 50 points from mentions
    const mentionScore = Math.min(Math.log10(mentions + 1) * 25, 50);
    
    // Position score (earlier mentions = higher score)
    // Calculate average position score, where earlier positions get higher scores
    const positionScore = positions.reduce((acc, pos) => {
      // Earlier positions get higher scores
      const positionWeight = Math.max(0, 100 - (pos / totalLength) * 100);
      return acc + positionWeight;
    }, 0) / positions.length;

    // Normalize position score to 0-50 range
    const normalizedPositionScore = (positionScore / 100) * 50;
    
    // Final score combines mention frequency and position importance
    return Math.min(mentionScore + normalizedPositionScore, 100);
  }

  async analyzeVisibility(company: CompetitorEntity): Promise<AnalyticsResult> {
    const result = this.analyticsRepository.create({
      companyId: company.id,
      // ... rest of the fields ...
    });

    return this.analyticsRepository.save(result);
  }

  async getVisibilityHistory(company: CompetitorEntity): Promise<AnalyticsResult[]> {
    return this.analyticsRepository.find({
      where: { companyId: company.id },
      order: { created_at: 'ASC' }
    });
  }
} 