import { Injectable, Inject } from '@nestjs/common';
import { ConversationAnalysis, Intent, Topic, Action, Sentiment } from './conversation-analyzer.service';

// Interfaces
export interface Conversation {
  id: string;
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
  insights: any[];
  engagementScore: number;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ConversationInsight {
  id: string;
  conversationId: string;
  type: 'intent' | 'sentiment' | 'topic' | 'action';
  category: string;
  confidence: number;
  details: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  conversation: Conversation | null;
}

// Search Service interface
export interface SearchService {
  indexConversation(data: {
    id: string;
    content: string;
    metadata: Record<string, any>;
  }): Promise<void>;
}

/**
 * Service for indexing conversations and insights
 */
@Injectable()
export class ConversationIndexerService {
  constructor(
    @Inject('ConversationInsightRepository')
    private readonly insightRepository: any,
    @Inject('SearchService')
    private readonly searchService: SearchService
  ) {}

  /**
   * Index a conversation and its insights
   * @param conversation The conversation to index
   * @param analysis Analysis results for the conversation
   */
  async indexConversation(
    conversation: Conversation,
    analysis: ConversationAnalysis
  ): Promise<void> {
    // Index insights
    await Promise.all([
      this.indexIntents(conversation, analysis.intents),
      this.indexTopics(conversation, analysis.topics),
      this.indexActions(conversation, analysis.actions),
      this.indexSentiment(conversation, analysis.sentiment),
    ]);

    // Index for search
    await this.searchService.indexConversation({
      id: conversation.id,
      content: this.extractContent(conversation),
      metadata: {
        ...conversation.metadata,
        insights: analysis,
      },
    });
  }

  /**
   * Index intents from analysis
   * @param conversation The conversation
   * @param intents Intents to index
   */
  private async indexIntents(
    conversation: Conversation,
    intents: Intent[]
  ): Promise<void> {
    await Promise.all(
      intents.map(intent =>
        this.createInsight(conversation, {
          type: 'intent',
          category: intent.category,
          confidence: intent.confidence,
          details: intent.details || {},
        })
      )
    );
  }

  /**
   * Index topics from analysis
   * @param conversation The conversation
   * @param topics Topics to index
   */
  private async indexTopics(
    conversation: Conversation,
    topics: Topic[]
  ): Promise<void> {
    await Promise.all(
      topics.map(topic =>
        this.createInsight(conversation, {
          type: 'topic',
          category: topic.name,
          confidence: topic.relevance,
          details: { mentions: topic.mentions },
        })
      )
    );
  }

  /**
   * Index actions from analysis
   * @param conversation The conversation
   * @param actions Actions to index
   */
  private async indexActions(
    conversation: Conversation,
    actions: Action[]
  ): Promise<void> {
    await Promise.all(
      actions.map(action =>
        this.createInsight(conversation, {
          type: 'action',
          category: action.type,
          confidence: action.confidence,
          details: action.context || {},
        })
      )
    );
  }

  /**
   * Index sentiment from analysis
   * @param conversation The conversation
   * @param sentiment Sentiment to index
   */
  private async indexSentiment(
    conversation: Conversation,
    sentiment: Sentiment
  ): Promise<void> {
    await this.createInsight(conversation, {
      type: 'sentiment',
      category: 'overall',
      confidence: sentiment.overall,
      details: {
        score: sentiment.overall,
        progression: sentiment.progression,
      },
    });
  }

  /**
   * Create an insight in the database
   * @param conversation The conversation
   * @param data Insight data
   * @returns Created insight
   */
  private async createInsight(
    conversation: Conversation,
    data: {
      type: 'intent' | 'sentiment' | 'topic' | 'action';
      category: string;
      confidence: number;
      details: Record<string, any>;
    }
  ): Promise<ConversationInsight> {
    const insight = this.insightRepository.create({
      conversation,
      type: data.type,
      category: data.category,
      confidence: data.confidence,
      details: data.details,
    });

    return this.insightRepository.save(insight);
  }

  /**
   * Extract content from a conversation for indexing
   * @param conversation The conversation
   * @returns Formatted content string
   */
  private extractContent(conversation: Conversation): string {
    return conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }
} 