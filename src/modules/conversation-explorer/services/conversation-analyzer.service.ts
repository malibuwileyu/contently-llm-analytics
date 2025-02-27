import { Injectable, Inject } from '@nestjs/common';
import { createHash } from 'crypto';

// Interfaces
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Intent {
  category: string;
  confidence: number;
  details?: Record<string, any>;
}

export interface Sentiment {
  overall: number;
  progression: number;
  aspects: Array<{ aspect: string; score: number }>;
}

export interface Topic {
  name: string;
  relevance: number;
  mentions: number;
}

export interface Action {
  type: string;
  confidence: number;
  context?: Record<string, any>;
}

export interface ConversationAnalysis {
  intents: Intent[];
  sentiment: Sentiment;
  topics: Topic[];
  actions: Action[];
}

// NLP Service interface
export interface NLPService {
  analyzeConversation(messages: Message[]): Promise<NLPAnalysis>;
}

// NLP Analysis interface
export interface NLPAnalysis {
  intents: Array<{ category: string; confidence: number; context: Record<string, any> }>;
  sentiment: {
    score: number;
    progression: number;
    aspects: Array<{ aspect: string; score: number }>;
  };
  topics: Array<{ name: string; relevance: number; mentions: number }>;
  actions: Array<{ type: string; confidence: number; context: Record<string, any> }>;
}

// Cache Service interface
export interface CacheService {
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Service for analyzing conversations
 */
@Injectable()
export class ConversationAnalyzerService {
  constructor(
    @Inject('NLPService') private readonly nlpService: NLPService,
    @Inject('CacheService') private readonly cache: CacheService
  ) {}

  /**
   * Analyze a conversation to extract insights
   * @param messages The messages in the conversation
   * @returns Analysis results
   */
  async analyzeConversation(messages: Message[]): Promise<ConversationAnalysis> {
    // Create a cache key based on the messages hash
    const cacheKey = `conversation:${createHash('md5')
      .update(JSON.stringify(messages))
      .digest('hex')}`;
    
    // Try to get from cache first, or compute and cache if not found
    return this.cache.getOrSet<ConversationAnalysis>(
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
      900 // Cache for 15 minutes
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