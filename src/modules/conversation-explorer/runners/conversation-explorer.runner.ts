import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { ConversationAnalyzerService } from '../services/conversation-analyzer.service';
import { ConversationIndexerService } from '../services/conversation-indexer.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationInsightRepository } from '../repositories/conversation-insight.repository';
import { DataSource } from 'typeorm';
import { AnalyzeConversationDto, TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { Logger } from '@nestjs/common';
import { NLPService } from '../../nlp/nlp.service';
import { SearchService } from '../../search/search.service';
import { MetricsService } from '../../metrics/metrics.service';
import { CacheService } from '../../cache/cache.service';
import { ConversationAnalysis } from '../types/conversation-analysis.type';
import { ConversationTrends } from '../types/conversation-trends.type';
import { ConversationInsight } from '../entities/conversation-insight.entity';
import { Entity } from '../types/conversation-analysis.type';

// Define string literals for insight types to match the entity types
const INSIGHT_TYPE = {
  INTENT: 'intent',
  SENTIMENT: 'sentiment',
  TOPIC: 'topic',
  ENTITY: 'entity',
  ACTION: 'action'
} as const;

// Define interfaces for the services to satisfy TypeScript
interface NLPServiceInterface {
  serviceUrl: string;
  analyzeSentiment(text: string): Promise<Record<string, unknown>>;
  extractTopics(text: string): Promise<Array<Record<string, unknown>>>;
  detectIntent(text: string): Promise<Array<Record<string, unknown>>>;
  identifyEntities(text: string): Promise<Array<Record<string, unknown>>>;
  analyzeConversation(messages: Array<Record<string, unknown>>): Promise<Record<string, unknown>>;
}

interface CacheServiceInterface {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

interface MetricsServiceInterface {
  trackEvent(eventName: string, properties: Record<string, unknown>): void;
  trackTiming(category: string, variable: string, time: number, properties?: Record<string, unknown>): void;
  recordAnalysisDuration(duration: number): void;
  incrementErrorCount(type: string): void;
}

/**
 * Runner for the Conversation Explorer module
 * 
 * This runner orchestrates the conversation analysis process by initializing
 * all required dependencies and providing methods to analyze conversations
 * and retrieve trends.
 */
export class ConversationExplorerRunner {
  private service: ConversationExplorerService;
  private logger = new Logger(ConversationExplorerRunner.name);

  /**
   * Initialize the runner with all required dependencies
   * @param dataSource TypeORM data source for database access
   * @param nlpServiceUrl URL of the NLP service for conversation analysis
   * @param searchServiceUrl URL of the search service for indexing
   * @param cacheService Optional cache service for improved performance
   * @param metricsService Optional metrics service for monitoring
   */
  constructor(
    private readonly dataSource: DataSource,
    private readonly nlpServiceUrl: string,
    private readonly searchServiceUrl: string,
    private readonly cacheService?: CacheService,
    private readonly metricsService?: MetricsService,
  ) {
    this.initialize();
  }

  /**
   * Initialize all services and repositories
   */
  private initialize(): void {
    try {
      // Initialize repositories
      const conversationRepository = new ConversationRepository(this.dataSource);
      
      // Create a repository for ConversationInsight
      const insightRepo = this.dataSource.getRepository(ConversationInsight);
      const insightRepository = new ConversationInsightRepository(insightRepo, this.dataSource);

      // Create simplified mock services for testing
      const nlpService = this.createMockNLPService();
      const searchService = new SearchService(this.searchServiceUrl);
      const cacheServiceWrapper = this.createMockCacheService();
      const metricsServiceWrapper = this.createMockMetricsService();

      // Initialize services
      const analyzerService = new ConversationAnalyzerService(
        nlpService as unknown as NLPService,
        cacheServiceWrapper as unknown as CacheService
      );

      const indexerService = new ConversationIndexerService(
        insightRepo,
        searchService
      );

      // Initialize main service with all required parameters
      this.service = new ConversationExplorerService(
        conversationRepository,
        insightRepository,
        analyzerService,
        indexerService,
        metricsServiceWrapper as unknown as MetricsService
      );

      this.logger.log('ConversationExplorerRunner initialized successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to initialize ConversationExplorerRunner: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Create a mock NLP service for testing
   * @returns A mock NLP service
   */
  private createMockNLPService(): NLPServiceInterface {
    return {
      serviceUrl: this.nlpServiceUrl,
      analyzeSentiment: async (_text: string): Promise<Record<string, unknown>> => {
        return { overall: 0.5, progression: 0.1, aspects: [] };
      },
      extractTopics: async (_text: string): Promise<Array<Record<string, unknown>>> => {
        return [{ name: 'general', relevance: 0.8, mentions: 1 }];
      },
      detectIntent: async (_text: string): Promise<Array<Record<string, unknown>>> => {
        return [{ category: 'general', confidence: 0.7, details: {} }];
      },
      identifyEntities: async (_text: string): Promise<Array<Record<string, unknown>>> => {
        return [{ type: 'generic', value: 'entity', confidence: 0.6 }];
      },
      analyzeConversation: async (_messages: Array<Record<string, unknown>>): Promise<Record<string, unknown>> => {
        return {
          intents: [{ category: 'general', confidence: 0.7, details: {} }],
          topics: [{ name: 'general', relevance: 0.8, mentions: 1 }],
          sentiment: { overall: 0.5, progression: 0.1, aspects: [] },
          entities: [{ type: 'generic', value: 'entity', confidence: 0.6 }]
        };
      }
    };
  }

  /**
   * Create a mock cache service for testing
   * @returns A mock cache service
   */
  private createMockCacheService(): CacheServiceInterface {
    return {
      get: async <T>(_key: string): Promise<T | null> => null,
      set: async (_key: string, _value: unknown, _ttl?: number): Promise<void> => {},
      delete: async (_key: string): Promise<void> => {},
      getOrSet: async <T>(_key: string, factory: () => Promise<T>, _ttl?: number): Promise<T> => factory()
    };
  }

  /**
   * Create a mock metrics service for testing
   * @returns A mock metrics service
   */
  private createMockMetricsService(): MetricsServiceInterface {
    return {
      trackEvent: (_eventName: string, _properties: Record<string, unknown>): void => {},
      trackTiming: (_category: string, _variable: string, _time: number, _properties?: Record<string, unknown>): void => {},
      recordAnalysisDuration: (_duration: number): void => {},
      incrementErrorCount: (_type: string): void => {}
    };
  }

  /**
   * Analyze a conversation to extract insights
   * @param input The conversation data to analyze
   * @returns The analyzed conversation with insights
   */
  async analyzeConversation(input: AnalyzeConversationDto): Promise<ConversationAnalysis> {
    try {
      this.logger.debug(`Analyzing conversation for brand: ${input.brandId}`);
      const startTime = Date.now();
      
      // Get the conversation with analysis from the service
      const conversation = await this.service.analyzeConversation(input);
      
      // Convert to ConversationAnalysis format
      const analysis: ConversationAnalysis = {
        intents: conversation.insights
          .filter(insight => insight.type === INSIGHT_TYPE.INTENT)
          .map(intent => ({
            category: intent.category,
            confidence: intent.confidence
          })),
        sentiment: conversation.insights
          .find(insight => insight.type === INSIGHT_TYPE.SENTIMENT)?.confidence || 0,
        topics: conversation.insights
          .filter(insight => insight.type === INSIGHT_TYPE.TOPIC)
          .map(topic => ({
            name: topic.category,
            relevance: topic.confidence
          })),
        entities: conversation.insights
          .filter(insight => insight.type === INSIGHT_TYPE.ENTITY)
          .map(entity => ({
            type: entity.category,
            value: entity.details?.value?.toString() || '',
            confidence: entity.confidence
          })) as Entity[],
        engagementScore: conversation.engagementScore || 0
      };
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Conversation analysis completed in ${duration}ms`);
      
      return analysis;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error analyzing conversation: ${errorMessage}`, errorStack);
      throw error;
    }
  }

  /**
   * Get trends from conversations for a specific brand
   * @param brandId The brand ID to get trends for
   * @param options Optional parameters for trend analysis
   * @returns Conversation trends including top intents, topics, engagement, and actions
   */
  async getConversationTrends(brandId: string, options?: TrendOptionsDto): Promise<ConversationTrends> {
    try {
      this.logger.debug(`Getting conversation trends for brand: ${brandId}`);
      const startTime = Date.now();
      
      const result = await this.service.getConversationTrends(brandId, options);
      
      // Convert to the expected ConversationTrends format
      const trends: ConversationTrends = {
        topIntents: result.topIntents,
        topTopics: result.topTopics,
        engagementTrends: result.engagementTrend.map(trend => ({
          date: trend.date,
          averageEngagement: trend.averageEngagement
        })),
        commonActions: result.commonActions
      };
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Trend analysis completed in ${duration}ms`);
      
      return trends;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error getting conversation trends: ${errorMessage}`, errorStack);
      throw error;
    }
  }
} 