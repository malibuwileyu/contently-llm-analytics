import { Injectable, Inject } from '@nestjs/common';
import { ConversationAnalyzerService, ConversationAnalysis } from './conversation-analyzer.service';
import { ConversationIndexerService, Conversation } from './conversation-indexer.service';

// Interfaces
export interface AnalyzeConversationDto {
  brandId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };
}

export interface TrendOptionsDto {
  startDate?: Date;
  endDate?: Date;
}

export interface TopIntent {
  category: string;
  count: number;
  averageConfidence: number;
}

export interface TopTopic {
  name: string;
  count: number;
  averageRelevance: number;
}

export interface EngagementTrend {
  date: Date;
  averageEngagement: number;
}

export interface CommonAction {
  type: string;
  count: number;
  averageConfidence: number;
}

export interface ConversationTrends {
  topIntents: TopIntent[];
  topTopics: TopTopic[];
  engagementTrends: EngagementTrend[];
  commonActions: CommonAction[];
}

// Metrics Service interface
export interface MetricsService {
  recordAnalysisDuration(duration: number): void;
  incrementErrorCount(errorType: string): void;
}

@Injectable()
export class ConversationExplorerService {
  constructor(
    @Inject('ConversationRepository')
    private readonly conversationRepo: any,
    private readonly analyzer: ConversationAnalyzerService,
    private readonly indexer: ConversationIndexerService,
    @Inject('MetricsService')
    private readonly metrics: MetricsService
  ) {}

  async analyzeConversation(
    data: AnalyzeConversationDto
  ): Promise<Conversation> {
    const startTime = Date.now();

    try {
      // Analyze conversation
      const analysis = await this.analyzer.analyzeConversation(data.messages);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(
        data.messages,
        analysis
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
      await this.indexer.indexConversation(conversation, analysis);

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.conversationRepo.findWithInsights(conversation.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  async getConversationTrends(
    brandId: string,
    options?: TrendOptionsDto
  ): Promise<ConversationTrends> {
    try {
      const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
      const endDate = options?.endDate || new Date(); // Default to now

      const [conversations, engagementTrends] = await Promise.all([
        this.conversationRepo.findByBrandId(brandId, {
          order: { analyzedAt: 'DESC' },
          take: 100,
        }),
        this.conversationRepo.getEngagementTrend(
          brandId,
          startDate,
          endDate
        ),
      ]);

      return {
        topIntents: this.extractTopIntents(conversations),
        topTopics: this.extractTopTopics(conversations),
        engagementTrends,
        commonActions: this.extractCommonActions(conversations),
      };
    } catch (error) {
      this.metrics.incrementErrorCount('trends_error');
      throw error;
    }
  }

  private calculateEngagementScore(
    messages: Array<{ role: string; content: string; timestamp: Date }>,
    analysis: ConversationAnalysis
  ): number {
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    const factors = {
      // Message count factor (more messages = higher engagement)
      messageCount: Math.min(messages.length * 0.05, 0.3),
      
      // Message length factor (longer messages = higher engagement)
      messageLength: Math.min(
        (messages.reduce((sum, msg) => sum + msg.content.length, 0) / 
        Math.max(messages.length, 1)) * 0.001, 
        0.2
      ),
      
      // Response time factor (quicker responses = higher engagement)
      responseTime: this.calculateResponseTimeFactor(messages),
      
      // Sentiment progression factor (improving sentiment = higher engagement)
      sentimentProgression: Math.min(Math.max(analysis.sentiment.progression, 0), 0.2),
      
      // Intent confidence factor (stronger intents = higher engagement)
      intentConfidence: Math.min(
        analysis.intents.reduce((sum, intent) => sum + intent.confidence, 0) * 0.1,
        0.2
      ),
    };

    // Sum all factors and ensure the result is between 0 and 1
    return Math.min(
      Math.max(
        Object.values(factors).reduce((sum, value) => sum + value, 0),
        0
      ),
      1
    );
  }

  private calculateResponseTimeFactor(
    messages: Array<{ role: string; content: string; timestamp: Date }>
  ): number {
    if (messages.length < 2) return 0;
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < messages.length; i++) {
      if (
        messages[i].role === 'assistant' && 
        messages[i-1].role === 'user'
      ) {
        const responseTime = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
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
        }))
    );

    return this.aggregateByCategory(intents, 'category', 'confidence')
      .slice(0, 10);
  }

  private extractTopTopics(conversations: Conversation[]): TopTopic[] {
    const topics = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'topic')
        .map(insight => ({
          name: insight.category,
          relevance: insight.confidence,
        }))
    );

    return this.aggregateByCategory(topics, 'name', 'relevance')
      .map(item => ({
        name: item.category,
        count: item.count,
        averageRelevance: item.averageConfidence,
      }))
      .slice(0, 10);
  }

  private extractCommonActions(conversations: Conversation[]): CommonAction[] {
    const actions = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'action')
        .map(insight => ({
          type: insight.category,
          confidence: insight.confidence,
        }))
    );

    return this.aggregateByCategory(actions, 'type', 'confidence')
      .map(item => ({
        type: item.category,
        count: item.count,
        averageConfidence: item.averageConfidence,
      }))
      .slice(0, 10);
  }

  private aggregateByCategory<T extends Record<string, any>>(
    items: T[],
    categoryKey: string,
    confidenceKey: string
  ): Array<{ category: string; count: number; averageConfidence: number }> {
    const grouped = items.reduce((acc, item) => {
      const category = item[categoryKey];
      if (!acc[category]) {
        acc[category] = { count: 0, totalConfidence: 0 };
      }
      acc[category].count++;
      acc[category].totalConfidence += item[confidenceKey];
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number }>);

    return Object.entries(grouped)
      .map(([category, { count, totalConfidence }]) => ({
        category,
        count,
        averageConfidence: totalConfidence / count,
      }))
      .sort((a, b) => b.count - a.count);
  }
} 