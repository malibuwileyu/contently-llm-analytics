import { Injectable, Logger } from '@nestjs/common';
import { MentionEntity } from '../entities/mention.entity';

/**
 * Service for analyzing sentiment of brand mentions
 */
@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);

  /**
   * Analyze sentiment for a mention
   * @param mention The mention entity
   * @returns The updated mention with sentiment analysis
   */
  async analyzeSentiment(mention: MentionEntity): Promise<MentionEntity> {
    this.logger.debug(`Analyzing sentiment for mention ${mention.id}`);

    // In a real implementation, this would use a more sophisticated NLP approach
    // or call an external API like Google Cloud Natural Language
    const { score, label } = this.simpleSentimentAnalysis(mention.context);

    mention.sentimentScore = score;
    mention.sentimentLabel = label;

    return mention;
  }

  /**
   * Analyze sentiment for multiple mentions
   * @param mentions Array of mention entities
   * @returns Array of updated mentions with sentiment analysis
   */
  async analyzeSentimentBatch(
    mentions: MentionEntity[],
  ): Promise<MentionEntity[]> {
    this.logger.debug(`Analyzing sentiment for ${mentions.length} mentions`);

    const analyzedMentions: MentionEntity[] = [];

    for (const mention of mentions) {
      const analyzedMention = await this.analyzeSentiment(mention);
      analyzedMentions.push(analyzedMention);
    }

    return analyzedMentions;
  }

  /**
   * Simple sentiment analysis based on keyword matching
   * @param text The text to analyze
   * @returns Object with sentiment score and label
   */
  private simpleSentimentAnalysis(text: string): {
    score: number;
    label: string;
  } {
    const lowerText = text.toLowerCase();

    // Positive keywords
    const positiveKeywords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'awesome',
      'best',
      'love',
      'perfect',
      'recommend',
      'quality',
      'comfortable',
      'reliable',
      'durable',
      'innovative',
    ];

    // Negative keywords
    const negativeKeywords = [
      'bad',
      'poor',
      'terrible',
      'awful',
      'worst',
      'hate',
      'disappointing',
      'avoid',
      'overpriced',
      'uncomfortable',
      'unreliable',
      'breaks',
      'cheap',
      'defective',
    ];

    // Count positive and negative keywords
    let positiveCount = 0;
    let negativeCount = 0;

    for (const keyword of positiveKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    }

    for (const keyword of negativeKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    }

    // Calculate sentiment score (-1 to 1)
    let score = 0;
    const totalKeywords = positiveCount + negativeCount;

    if (totalKeywords > 0) {
      score = (positiveCount - negativeCount) / totalKeywords;
    }

    // Determine sentiment label
    let label = 'neutral';
    if (score > 0.2) {
      label = 'positive';
    } else if (score < -0.2) {
      label = 'negative';
    }

    return { score, label };
  }
}
