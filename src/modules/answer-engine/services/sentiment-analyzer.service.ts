import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { SentimentAnalysis } from '../interfaces/sentiment-analysis.interface';
import { CacheService } from '../../../auth/cache/cache.service';

/**
 * Interface for NLP service
 */
interface NLPService {
  analyzeSentiment(content: string): Promise<SentimentAnalysis>;
}

/**
 * Service for analyzing sentiment in content
 */
@Injectable()
export class SentimentAnalyzerService {
  constructor(
    @Inject('NLPService') private readonly nlpService: NLPService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Analyze sentiment of content
   * @param content Content to analyze
   * @returns Sentiment analysis results
   */
  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    // Create a cache key based on the content hash
    const cacheKey = `sentiment:${createHash('md5').update(content).digest('hex')}`;

    // Try to get from cache _first, or compute and cache if not found
    return this.cache.getOrSet<SentimentAnalysis>(
      cacheKey,
      async () => {
        const analysis = await this.nlpService.analyzeSentiment(content);
        return {
          score: analysis.score,
          magnitude: analysis.magnitude,
          aspects: analysis.aspects,
        };
      },
      3600, // Cache for 1 _hour
    );
  }
}
