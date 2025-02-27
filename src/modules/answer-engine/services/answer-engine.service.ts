import { Injectable } from '@nestjs/common';
import { subDays } from 'date-fns';
import { BrandMentionRepository } from '../repositories/brand-mention.repository';
import { SentimentAnalyzerService } from './sentiment-analyzer.service';
import { CitationTrackerService } from './citation-tracker.service';
import { BrandMention } from '../entities/brand-mention.entity';
import { Citation } from '../entities/citation.entity';
import { AnalyzeContentDto } from '../dto/analyze-content.dto';
import { BrandHealth } from '../interfaces/sentiment-analysis.interface';

/**
 * Interface for metrics service
 */
interface MetricsService {
  recordAnalysisDuration(duration: number): void;
  incrementErrorCount(type: string): void;
}

/**
 * Main service for the Answer Engine
 */
@Injectable()
export class AnswerEngineService {
  constructor(
    private readonly brandMentionRepo: BrandMentionRepository,
    private readonly sentimentAnalyzer: SentimentAnalyzerService,
    private readonly citationTracker: CitationTrackerService,
    private readonly metrics: MetricsService
  ) {}

  /**
   * Analyze content for brand mentions
   * @param data Content analysis data
   * @returns Brand mention with citations
   */
  async analyzeMention(data: AnalyzeContentDto): Promise<BrandMention> {
    const startTime = Date.now();

    try {
      // Analyze sentiment of the content
      const sentiment = await this.sentimentAnalyzer.analyzeSentiment(data.content);

      // Create the brand mention
      const mention = await this.brandMentionRepo.save({
        brandId: data.brandId,
        content: data.content,
        sentiment: sentiment.score,
        context: data.context as unknown as Record<string, unknown>,
      });

      // Track citations if provided
      if (data.citations?.length) {
        await Promise.all(
          data.citations.map(citation =>
            this.citationTracker.trackCitation({
              source: citation.source,
              brandMention: mention,
              metadata: citation.metadata,
            })
          )
        );
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      // Return the brand mention with citations
      return this.brandMentionRepo.findWithCitations(mention.id);
    } catch (error) {
      // Record error metrics
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  /**
   * Get health metrics for a brand
   * @param brandId ID of the brand
   * @returns Brand health metrics
   */
  async getBrandHealth(brandId: string): Promise<BrandHealth> {
    // Get recent mentions and sentiment trend
    const [mentions, sentimentTrend] = await Promise.all([
      this.brandMentionRepo.findByBrandId(brandId, {
        order: { mentionedAt: 'DESC' },
        take: 100,
      }),
      this.brandMentionRepo.getSentimentTrend(
        brandId,
        subDays(new Date(), 30), // Last 30 days
        new Date()
      ),
    ]);

    // Calculate overall health metrics
    return {
      overallSentiment: this.calculateOverallSentiment(mentions),
      trend: sentimentTrend,
      mentionCount: mentions.length,
      topCitations: await this.getTopCitations(mentions),
    };
  }

  /**
   * Calculate overall sentiment from mentions
   * @param mentions Array of brand mentions
   * @returns Overall sentiment score
   */
  private calculateOverallSentiment(mentions: BrandMention[]): number {
    if (!mentions.length) return 0;
    return mentions.reduce((sum, mention) => sum + mention.sentiment, 0) / mentions.length;
  }

  /**
   * Get top citations from mentions
   * @param mentions Array of brand mentions
   * @returns Array of top citations
   */
  private async getTopCitations(mentions: BrandMention[]): Promise<Pick<Citation, 'source' | 'authority'>[]> {
    // Get all citations from the mentions
    const mentionIds = mentions.map(mention => mention.id);
    const citations = await this.citationTracker.getCitationsByBrandMention(mentionIds[0]);
    
    // Sort by authority and take top 10
    return citations
      .sort((a, b) => b.authority - a.authority)
      .slice(0, 10)
      .map(citation => ({
        source: citation.source,
        authority: citation.authority,
      }));
  }
} 