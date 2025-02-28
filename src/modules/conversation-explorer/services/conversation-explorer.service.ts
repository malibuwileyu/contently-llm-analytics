import { Injectable, Inject } from '@nestjs/common';
import { ConversationAnalyzerService } from './conversation-analyzer.service';
import { ConversationIndexerService } from './conversation-indexer.service';
import { ConversationRepository } from '../repositories/conversation.repository';
import { ConversationInsightRepository } from '../repositories/conversation-insight.repository';
import { Conversation } from '../entities/conversation.entity';
import { ConversationInsightType } from '../graphql/types/conversation-insight.type';
import { ConversationInsightOptionsInput } from '../graphql/inputs/conversation-insight-options.input';
import { AnalyzeConversationDto } from '../dto/analyze-conversation.dto';
import { TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { ConversationTrendsType } from '../graphql/types/conversation-trends.type';
import { ConversationAnalysis } from '../interfaces/conversation-analysis.interface';
import {
  TopIntent,
  TopTopic,
} from '../interfaces/conversation-analysis.interface';
import { MetricsService as ExternalMetricsService } from '../../metrics/metrics.service';

/**
 * Service for exploring conversations
 */
@Injectable()
export class ConversationExplorerService {
  constructor(
    @Inject('ConversationRepository')
    private readonly conversationRepo: ConversationRepository,
    private readonly conversationInsightRepo: ConversationInsightRepository,
    private readonly analyzerService: ConversationAnalyzerService,
    private readonly indexerService: ConversationIndexerService,
    private readonly metrics: ExternalMetricsService,
  ) {}

  async analyzeConversation(
    data: AnalyzeConversationDto,
  ): Promise<Conversation> {
    const startTime = Date.now();

    try {
      // Analyze conversation
      const analysis = await this.analyzerService.analyzeConversation(
        data.messages,
      );

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(
        data.messages,
        analysis,
      );

      // Create conversation record
      const conversation = await this.conversationRepo.save({
        brandId: data.brandId,
        messages: data.messages,
        metadata: data.metadata,
        engagementScore,
        analyzedAt: new Date(),
      });

      // Index conversation and insights
      await this.indexerService.indexConversation(conversation, analysis);

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.conversationRepo.findWithInsights(conversation.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  /**
   * Get conversation trends for a brand
   * @param brandId ID of the brand
   * @param options Options for trend analysis
   * @returns Conversation trends
   */
  async getConversationTrends(
    brandId: string,
    options: TrendOptionsDto = {},
  ): Promise<ConversationTrendsType> {
    const startDate =
      options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
    const endDate = options.endDate || new Date(); // Default to now

    const engagementTrend = await this.conversationRepo.getEngagementTrend(
      brandId,
      startDate,
      endDate,
    );
    const trends = await this.conversationRepo.getTrends(brandId, options);

    return {
      engagementTrend,
      topIntents: trends.topIntents || [],
      topTopics: trends.topTopics || [],
      commonActions: trends.commonActions || [],
    };
  }

  async getConversationById(id: string): Promise<Conversation> {
    return this.conversationRepo.findWithInsights(id);
  }

  /**
   * Find conversations by brand ID
   * @param brandId ID of the brand
   * @returns Array of conversations
   */
  async findByBrandId(brandId: string): Promise<Conversation[]> {
    return this.conversationRepo.findByBrandId(brandId, {});
  }

  async getConversationInsights(
    brandId: string,
    options?: ConversationInsightOptionsInput,
  ): Promise<ConversationInsightType[]> {
    return this.conversationRepo.findInsightsByBrandId(brandId, options);
  }

  private async processConversation(
    _conversation: Conversation,
  ): Promise<void> {
    // Implementation
  }

  protected calculateEngagementScore(
    messages: Array<{ role: string; content: string; timestamp: Date }>,
    analysis: ConversationAnalysis,
  ): number {
    const factors = {
      // Message count factor (more messages = higher engagement)
      messageCount: Math.min(messages.length * 0.05, 0.3),

      // Message length factor (longer messages = higher engagement)
      messageLength: Math.min(
        (messages.reduce((sum, msg) => sum + msg.content.length, 0) /
          Math.max(messages.length, 1)) *
          0.001,
        0.2,
      ),

      // Response time factor (quicker responses = higher engagement)
      responseTime: this.calculateResponseTimeFactor(messages),

      // Sentiment progression factor (improving sentiment = higher engagement)
      sentimentProgression: Math.min(
        Math.max(analysis.sentiment.progression, 0),
        0.2,
      ),

      // Intent confidence factor (stronger intents = higher engagement)
      intentConfidence: Math.min(
        analysis.intents.reduce((sum, intent) => sum + intent.confidence, 0) *
          0.1,
        0.2,
      ),
    };

    // Sum all factors and ensure the result is between 0 and 1
    return Math.min(
      Math.max(
        Object.values(factors).reduce((sum, value) => sum + value, 0),
        0,
      ),
      1,
    );
  }

  private calculateResponseTimeFactor(
    messages: Array<{ role: string; content: string; timestamp: Date }>,
  ): number {
    if (messages.length < 2) return 0;

    let totalResponseTime = 0;
    let responseCount = 0;

    for (let i = 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant' && messages[i - 1].role === 'user') {
        const responseTime =
          messages[i].timestamp.getTime() - messages[i - 1].timestamp.getTime();
        totalResponseTime += responseTime;
        responseCount++;
      }
    }

    if (responseCount === 0) return 0;

    // Average response time in seconds
    const avgResponseTime = totalResponseTime / responseCount / 1000;

    // Convert to a factor between 0 and 0.2 (lower response time = higher factor)
    return Math.min(Math.max(0.2 - (avgResponseTime / 60) * 0.1, 0), 0.2);
  }

  private extractTopIntents(conversations: Conversation[]): TopIntent[] {
    const intents = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'intent')
        .map(insight => ({
          category: insight.category,
          confidence: insight.confidence,
        })),
    );

    return this.aggregateByCategory(intents, 'category', 'confidence').slice(
      0,
      10,
    );
  }

  private extractTopTopics(conversations: Conversation[]): TopTopic[] {
    const topics = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'topic')
        .map(insight => ({
          name: insight.category,
          relevance: insight.confidence,
        })),
    );

    return this.aggregateByCategory(topics, 'name', 'relevance')
      .map(item => ({
        name: item.category,
        count: item.count,
        averageRelevance: item.averageConfidence,
      }))
      .slice(0, 10);
  }

  /**
   * Extract common actions from conversations
   * @param conversations Array of conversations
   * @returns Array of common actions
   */
  private extractCommonActions(
    conversations: Conversation[],
  ): Array<{ type: string; count: number; averageConfidence: number }> {
    const actions = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'action')
        .map(insight => ({
          type: insight.category,
          confidence: insight.confidence,
        })),
    );

    return this.aggregateByCategory(actions, 'type', 'confidence')
      .map(item => ({
        type: item.category,
        count: item.count,
        averageConfidence: item.averageConfidence,
      }))
      .slice(0, 10);
  }

  private aggregateByCategory<T extends Record<string, unknown>>(
    items: T[],
    categoryKey: keyof T,
    confidenceKey: keyof T,
  ): Array<{ category: string; count: number; averageConfidence: number }> {
    const grouped = items.reduce(
      (acc, item) => {
        const category = String(item[categoryKey]);
        if (!acc[category]) {
          acc[category] = { count: 0, totalConfidence: 0 };
        }
        acc[category].count++;
        acc[category].totalConfidence += Number(item[confidenceKey]);
        return acc;
      },
      {} as Record<string, { count: number; totalConfidence: number }>,
    );

    return Object.entries(grouped)
      .map(([category, { count, totalConfidence }]) => ({
        category,
        count,
        averageConfidence: totalConfidence / count,
      }))
      .sort((a, b) => b.count - a.count);
  }
}
