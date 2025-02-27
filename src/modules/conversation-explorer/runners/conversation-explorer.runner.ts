import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { ConversationAnalyzerService } from '../services/conversation-analyzer.service';
import { ConversationIndexerService } from '../services/conversation-indexer.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationInsightRepository } from '../repositories/conversation-insight.repository';
import { DataSource } from 'typeorm';
import { AnalyzeConversationDto } from '../dto/analyze-conversation.dto';
import { TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { Logger } from '@nestjs/common';
import { NLPService } from '../../nlp/services/nlp.service';
import { SearchService } from '../../search/services/search.service';
import { MetricsService } from '../../metrics/services/metrics.service';
import { CacheService } from '../services/conversation-analyzer.service';

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
    private readonly cacheService?: any,
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
      const insightRepository = new ConversationInsightRepository(this.dataSource);

      // Initialize NLP service client
      const nlpService: NLPService = {
        analyzeConversation: async (messages) => {
          // In a real implementation, this would call the external NLP service
          // For now, we'll use a placeholder implementation
          return {
            intents: [{ 
              category: 'help_request', 
              confidence: 0.85,
              context: { relevance: 0.9 }
            }],
            sentiment: { 
              score: 0.6, 
              progression: 0.2,
              aspects: [
                { aspect: 'service', score: 0.7 },
                { aspect: 'product', score: 0.5 }
              ]
            },
            topics: [{ 
              name: 'account', 
              relevance: 0.9,
              mentions: 3
            }],
            actions: [{ 
              type: 'request_info', 
              confidence: 0.75,
              context: { urgency: 'medium' }
            }],
          };
        }
      };

      // Initialize search service client
      const searchService: SearchService = {
        indexConversation: async (data: any) => {
          // In a real implementation, this would call the external search service
          // For now, we'll use a placeholder implementation
          this.logger.debug(`Indexed conversation: ${data.id}`);
        }
      };

      // Initialize cache service
      const cacheServiceImpl: CacheService = {
        getOrSet: async <T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> => {
          // In a real implementation, this would check the cache and store results
          // For now, we'll just call the factory function directly
          return factory();
        }
      };

      // Initialize services
      const analyzerService = new ConversationAnalyzerService(
        nlpService,
        cacheServiceImpl
      );

      const indexerService = new ConversationIndexerService(
        insightRepository,
        searchService
      );

      // Initialize main service
      this.service = new ConversationExplorerService(
        conversationRepository,
        analyzerService,
        indexerService,
        this.metricsService || {
          recordAnalysisDuration: (duration: number) => {
            this.logger.debug(`Analysis duration: ${duration}ms`);
          },
          incrementErrorCount: (errorType: string) => {
            this.logger.debug(`Error count incremented for: ${errorType}`);
          }
        }
      );

      this.logger.log('ConversationExplorerRunner initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize ConversationExplorerRunner: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze a conversation to extract insights
   * @param input The conversation data to analyze
   * @returns The analyzed conversation with insights
   */
  async analyzeConversation(input: AnalyzeConversationDto): Promise<any> {
    try {
      this.logger.debug(`Analyzing conversation for brand: ${input.brandId}`);
      const startTime = Date.now();
      
      const result = await this.service.analyzeConversation(input);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Conversation analysis completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error analyzing conversation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get trends from conversations for a specific brand
   * @param brandId The brand ID to get trends for
   * @param options Optional parameters for trend analysis
   * @returns Conversation trends including top intents, topics, engagement, and actions
   */
  async getConversationTrends(brandId: string, options?: TrendOptionsDto): Promise<any> {
    try {
      this.logger.debug(`Getting conversation trends for brand: ${brandId}`);
      const startTime = Date.now();
      
      const result = await this.service.getConversationTrends(brandId, options);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Trend analysis completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      this.logger.error(`Error getting conversation trends: ${error.message}`, error.stack);
      throw error;
    }
  }
} 