import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProviderService } from '../ai-provider/services/openai-provider.service';

interface BrandAnalysisOptions {
  name: string;
  competitors: string[];
  industry: string;
}

interface BrandMention {
  content: string;
  position: number;
  sentiment: number;
}

interface CompetitorMention {
  name: string;
  distance: number;
  relationship: string;
  visibility: number;
  relativeDelta: number;
}

interface MarketPosition {
  prominence: number;
  contextScore: number;
  visibility: number;
  leadership: string;
  innovationRank: number;
  presenceRank: number;
}

interface BrandTrends {
  sentiment: number[];
  visibility: number[];
  engagement: number[];
}

interface BrandAnalysis {
  mentions: BrandMention[];
  competitorMentions: CompetitorMention[];
  marketPosition: MarketPosition;
  trends: BrandTrends;
}

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);

  constructor(private readonly aiProvider: OpenAIProviderService) {}

  async analyzeBrand(
    text: string,
    options: BrandAnalysisOptions,
  ): Promise<BrandAnalysis> {
    try {
      // First, analyze the text for brand mentions and sentiment
      const brandMentions = this.extractBrandMentions(text, options.name);
      const competitorMentions = this.extractCompetitorMentions(
        text,
        options.competitors,
      );

      // Then get AI to help analyze market position and trends
      const analysisPrompt = `
        Analyze this text for brand visibility metrics:
        
        Text: """
        ${text}
        """
        
        Focus on:
        - Brand: ${options.name}
        - Industry: ${options.industry}
        - Competitors: ${options.competitors.join(', ')}
        
        Provide a natural language analysis of:
        1. Market position and category leadership
        2. Brand visibility trends
        3. Engagement metrics
        4. Competitive dynamics
        5. Key strengths and attributes
      `;

      const aiAnalysis = await this.aiProvider.complete(analysisPrompt);

      // Extract market position and trends from AI analysis
      const marketPosition = this.extractMarketPosition(
        aiAnalysis.content,
        options,
      );
      const trends = this.extractTrends(aiAnalysis.content);

      return {
        mentions: brandMentions,
        competitorMentions,
        marketPosition,
        trends,
      };
    } catch (error) {
      this.logger.error('Error performing brand analysis:', error);
      throw error;
    }
  }

  private extractBrandMentions(
    text: string,
    brandName: string,
  ): BrandMention[] {
    // Simple extraction for now - can be enhanced with more sophisticated NLP
    const mentions: BrandMention[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach((sentence, idx) => {
      if (sentence.toLowerCase().includes(brandName.toLowerCase())) {
        mentions.push({
          content: sentence.trim(),
          position: idx,
          sentiment: this.calculateSentiment(sentence),
        });
      }
    });

    return mentions;
  }

  private extractCompetitorMentions(
    text: string,
    competitors: string[],
  ): CompetitorMention[] {
    const mentions: CompetitorMention[] = [];
    const sentences = text.split(/[.!?]+/);

    competitors.forEach(competitor => {
      const firstMention = sentences.findIndex(s =>
        s.toLowerCase().includes(competitor.toLowerCase()),
      );

      if (firstMention >= 0) {
        mentions.push({
          name: competitor,
          distance: firstMention,
          relationship: this.determineRelationship(sentences[firstMention]),
          visibility: Math.random() * 0.4 + 0.4, // Random score between 0.4 and 0.8
          relativeDelta: Math.random() * 0.2, // Random delta between 0 and 0.2
        });
      }
    });

    return mentions;
  }

  private extractMarketPosition(
    analysis: string,
    options: BrandAnalysisOptions,
  ): MarketPosition {
    // Extract market position metrics from AI analysis
    // This is a simplified implementation - can be enhanced with more sophisticated NLP
    return {
      prominence: 0.85,
      contextScore: 0.8,
      visibility: 0.85,
      leadership: 'dominant',
      innovationRank: 2,
      presenceRank: 1,
    };
  }

  private extractTrends(analysis: string): BrandTrends {
    // Extract trends from AI analysis
    const sentimentTrend = this.extractTrendValues(analysis, 'sentiment');
    const visibilityTrend = this.extractTrendValues(analysis, 'visibility');
    const engagementTrend = this.extractTrendValues(analysis, 'engagement');

    return {
      sentiment: sentimentTrend,
      visibility: visibilityTrend,
      engagement: engagementTrend,
    };
  }

  private extractTrendValues(text: string, aspect: string): number[] {
    // Simple implementation - returns mock trend data
    // Can be enhanced with actual trend extraction logic
    return [0.8, 0.75, 0.85, 0.9];
  }

  private calculateSentiment(text: string): number {
    // Simple sentiment calculation - can be enhanced with proper NLP
    const positiveWords = ['good', 'great', 'excellent', 'best', 'leading'];
    const negativeWords = ['bad', 'poor', 'worst', 'failing'];

    const words = text.toLowerCase().split(/\W+/);
    let score = 0.5; // Neutral starting point

    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      if (negativeWords.includes(word)) score -= 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }

  private determineRelationship(text: string): string {
    // Simple relationship determination - can be enhanced with proper NLP
    const words = text.toLowerCase();

    if (
      words.includes('better') ||
      words.includes('leading') ||
      words.includes('ahead')
    ) {
      return 'superior';
    }
    if (
      words.includes('worse') ||
      words.includes('behind') ||
      words.includes('trailing')
    ) {
      return 'inferior';
    }
    return 'comparable';
  }

  async analyzeResponse(_analysis: string, _options?: any): Promise<any> {
    // Implementation
  }

  async analyzeAspect(_text: string, _aspect: string): Promise<any> {
    // Implementation
  }

  async analyzeText(text: string): Promise<any> {
    try {
      const response = await this.aiProvider.complete(text);
      return response;
    } catch (error) {
      this.logger.error(`Error analyzing text: ${error.message}`);
      throw error;
    }
  }
}
