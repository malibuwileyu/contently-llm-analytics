import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import {
  Message,
  ConversationAnalysis as IConversationAnalysis,
  Intent,
  Sentiment,
  Topic,
  Action,
} from '../interfaces/conversation-analysis.interface';

/**
 * Interface for NLP service
 */
interface NLPService {
  analyzeConversation(messages: Message[]): Promise<NLPAnalysis>;
}

/**
 * Interface for cache service
 */
interface CacheService {
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Interface for NLP analysis result
 */
interface NLPAnalysis {
  intents: {
    category: string;
    confidence: number;
    context: Record<string, unknown>;
  }[];
  sentiment: {
    score: number;
    progression: number;
    aspects: {
      aspect: string;
      score: number;
    }[];
  };
  topics: {
    name: string;
    relevance: number;
    mentions: number;
  }[];
  actions: {
    type: string;
    confidence: number;
    context: Record<string, unknown>;
  }[];
}

/**
 * Service for analyzing conversations
 */
@Injectable()
export class ConversationAnalyzerService {
  constructor(
    @Inject('NLPService') private readonly nlpService: NLPService,
    @Inject('CacheService') private readonly cache: CacheService,
  ) {}

  /**
   * Analyze a conversation to extract insights
   * @param messages The messages in the conversation
   * @returns Analysis results
   */
  async analyzeConversation(
    messages: Message[],
  ): Promise<IConversationAnalysis> {
    // Create a cache key based on the messages hash
    const cacheKey = `conversation:${createHash('md5')
      .update(JSON.stringify(messages))
      .digest('hex')}`;

    // Try to get from cache first, or compute and cache if not found
    return this.cache.getOrSet<IConversationAnalysis>(
      cacheKey,
      async () => {
        const analysis = await this.nlpService.analyzeConversation(messages);
        return {
          intents: this.extractIntents(analysis),
          sentiment: this.calculateSentiment(analysis),
          topics: this.identifyTopics(analysis),
          actions: this.extractActions(analysis),
        };
      },
      900, // Cache for 15 minutes
    );
  }

  /**
   * Extract intents from NLP analysis
   * @param analysis NLP analysis result
   * @returns Array of intents
   */
  private extractIntents(analysis: NLPAnalysis): Intent[] {
    return analysis.intents.map(intent => ({
      category: intent.category,
      confidence: intent.confidence,
      details: intent.context,
    }));
  }

  /**
   * Calculate sentiment from NLP analysis
   * @param analysis NLP analysis result
   * @returns Sentiment analysis
   */
  private calculateSentiment(analysis: NLPAnalysis): Sentiment {
    return {
      overall: analysis.sentiment.score,
      progression: analysis.sentiment.progression,
      aspects: analysis.sentiment.aspects,
    };
  }

  /**
   * Identify topics from NLP analysis
   * @param analysis NLP analysis result
   * @returns Array of topics
   */
  private identifyTopics(analysis: NLPAnalysis): Topic[] {
    return analysis.topics.map(topic => ({
      name: topic.name,
      relevance: topic.relevance,
      mentions: topic.mentions,
    }));
  }

  /**
   * Extract actions from NLP analysis
   * @param analysis NLP analysis result
   * @returns Array of actions
   */
  private extractActions(analysis: NLPAnalysis): Action[] {
    return analysis.actions.map(action => ({
      type: action.type,
      confidence: action.confidence,
      context: action.context,
    }));
  }
}
