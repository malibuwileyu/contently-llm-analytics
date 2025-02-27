import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SentimentAnalysis } from '../interfaces/sentiment-analysis.interface';

/**
 * Service for natural language processing tasks
 */
@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);
  private readonly apiKey: string;
  private readonly apiEndpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NLP_API_KEY', '');
    this.apiEndpoint = this.configService.get<string>('NLP_API_ENDPOINT', 'https://api.nlp-service.com');
  }

  /**
   * Analyze sentiment of content
   * @param content Content to analyze
   * @returns Sentiment analysis results
   */
  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    try {
      // In a real implementation, this would call an external NLP API
      // For now, we'll use a simple rule-based approach
      
      if (!content || content.trim().length === 0) {
        return {
          score: 0,
          magnitude: 0,
          aspects: [],
        };
      }

      // For demo purposes, we'll use a simple rule-based approach
      // In production, this would be replaced with a call to a real NLP API
      const analysis = this.performSimpleSentimentAnalysis(content);
      
      this.logger.debug(`Analyzed sentiment for content: ${content.substring(0, 50)}...`);
      
      return analysis;
    } catch (error) {
      this.logger.error(`Error analyzing sentiment: ${error.message}`, error.stack);
      throw new Error(`Failed to analyze sentiment: ${error.message}`);
    }
  }

  /**
   * Simple rule-based sentiment analysis
   * @param content Content to analyze
   * @returns Sentiment analysis results
   */
  private performSimpleSentimentAnalysis(content: string): SentimentAnalysis {
    const text = content.toLowerCase();
    
    // Define positive and negative word lists
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'happy', 'joy', 'love', 'like', 'best', 'better', 'positive',
      'recommend', 'impressive', 'awesome', 'outstanding', 'perfect',
      'brilliant', 'exceptional', 'superb', 'terrific', 'delightful',
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst',
      'hate', 'dislike', 'negative', 'disappointing', 'mediocre',
      'failure', 'fail', 'problem', 'issue', 'trouble', 'difficult',
      'frustrating', 'annoying', 'useless', 'waste', 'regret',
    ];
    
    // Count positive and negative words
    let positiveCount = 0;
    let negativeCount = 0;
    
    for (const word of positiveWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        positiveCount += matches.length;
      }
    }
    
    for (const word of negativeWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        negativeCount += matches.length;
      }
    }
    
    // Calculate sentiment score (-1 to 1)
    const totalWords = text.split(/\s+/).length;
    const totalSentimentWords = positiveCount + negativeCount;
    
    // If no sentiment words found, return neutral
    if (totalSentimentWords === 0) {
      return {
        score: 0,
        magnitude: 0,
        aspects: [],
      };
    }
    
    // Calculate score between -1 and 1
    const score = (positiveCount - negativeCount) / totalSentimentWords;
    
    // Calculate magnitude (0 to +∞) based on the ratio of sentiment words to total words
    const magnitude = (totalSentimentWords / totalWords) * 5;
    
    // Extract aspects (topics) with their sentiment
    const aspects = this.extractAspects(text, positiveWords, negativeWords);
    
    return {
      score,
      magnitude,
      aspects,
    };
  }

  /**
   * Extract aspects (topics) with their sentiment
   * @param text Text to analyze
   * @param positiveWords List of positive words
   * @param negativeWords List of negative words
   * @returns Array of aspects with sentiment scores
   */
  private extractAspects(
    text: string,
    positiveWords: string[],
    negativeWords: string[]
  ): Array<{ topic: string; score: number }> {
    // Define common aspects/topics
    const aspects = [
      { topic: 'performance', keywords: ['performance', 'speed', 'fast', 'slow', 'responsive'] },
      { topic: 'quality', keywords: ['quality', 'well-made', 'durable', 'cheap', 'premium'] },
      { topic: 'usability', keywords: ['usability', 'easy', 'difficult', 'intuitive', 'confusing'] },
      { topic: 'value', keywords: ['value', 'price', 'expensive', 'affordable', 'cost'] },
      { topic: 'support', keywords: ['support', 'service', 'help', 'assistance', 'customer service'] },
    ];
    
    const result: Array<{ topic: string; score: number }> = [];
    
    for (const aspect of aspects) {
      let positiveCount = 0;
      let negativeCount = 0;
      let hasAspect = false;
      
      // Check if aspect is mentioned in the text
      for (const keyword of aspect.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(text)) {
          hasAspect = true;
          
          // Find sentences containing the aspect keyword
          const sentences = text.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword)) {
              // Count positive and negative words in the sentence
              for (const word of positiveWords) {
                const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = sentence.match(wordRegex);
                if (matches) {
                  positiveCount += matches.length;
                }
              }
              
              for (const word of negativeWords) {
                const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
                const matches = sentence.match(wordRegex);
                if (matches) {
                  negativeCount += matches.length;
                }
              }
            }
          }
        }
      }
      
      // Calculate aspect sentiment score if the aspect is mentioned
      if (hasAspect) {
        const totalSentimentWords = positiveCount + negativeCount;
        const score = totalSentimentWords > 0
          ? (positiveCount - negativeCount) / totalSentimentWords
          : 0;
        
        result.push({
          topic: aspect.topic,
          score,
        });
      }
    }
    
    return result;
  }
} 