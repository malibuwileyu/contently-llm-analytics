import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationInsight, InsightType } from '../entities/conversation-insight.entity';
import { 
  ConversationAnalysis, 
  Intent, 
  Topic, 
  Action 
} from '../interfaces/conversation-analysis.interface';
import { CreateInsightDto } from '../interfaces/insight.interface';

/**
 * Interface for search service
 */
interface SearchService {
  indexConversation(data: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<void>;
}

/**
 * Service for indexing conversations and insights
 */
@Injectable()
export class ConversationIndexerService {
  constructor(
    @InjectRepository(ConversationInsight)
    private readonly insightRepo: Repository<ConversationInsight>,
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
        this.createInsight({
          conversation,
          type: 'intent',
          category: intent.category,
          confidence: intent.confidence,
          details: intent.details,
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
        this.createInsight({
          conversation,
          type: 'topic',
          category: topic.name,
          confidence: topic.relevance,
          details: {
            mentions: topic.mentions,
          },
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
        this.createInsight({
          conversation,
          type: 'action',
          category: action.type,
          confidence: action.confidence,
          details: action.context,
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
    sentiment: { overall: number; progression: number; aspects: { aspect: string; score: number }[] }
  ): Promise<void> {
    // Index overall sentiment
    await this.createInsight({
      conversation,
      type: 'sentiment',
      category: 'overall',
      confidence: Math.abs(sentiment.overall), // Use absolute value for confidence
      details: {
        score: sentiment.overall,
        progression: sentiment.progression,
      },
    });

    // Index aspect-based sentiments
    await Promise.all(
      sentiment.aspects.map(aspect =>
        this.createInsight({
          conversation,
          type: 'sentiment',
          category: aspect.aspect,
          confidence: Math.abs(aspect.score),
          details: {
            score: aspect.score,
          },
        })
      )
    );
  }

  /**
   * Create an insight in the database
   * @param data Insight data
   * @returns Created insight
   */
  private async createInsight(data: CreateInsightDto): Promise<ConversationInsight> {
    const insight = this.insightRepo.create({
      conversationId: data.conversation.id,
      type: data.type as InsightType,
      category: data.category,
      confidence: data.confidence,
      details: data.details,
    });

    // Set the relation after creation
    insight.conversation = data.conversation;

    return this.insightRepo.save(insight);
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