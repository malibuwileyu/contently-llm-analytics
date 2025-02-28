import { IsUUID, IsString, IsNumber, IsObject, IsDate, IsArray } from 'class-validator';

/**
 * DTO for a conversation insight
 */
export class ConversationInsightDto {
  /**
   * Unique identifier for the insight
   */
  @IsUUID()
  id: string;

  /**
   * Type of insight (intent, sentiment, topic, action)
   */
  @IsString()
  type: string;

  /**
   * Category of the insight
   */
  @IsString()
  category: string;

  /**
   * Confidence score for the insight (0-1)
   */
  @IsNumber()
  confidence: number;

  /**
   * Additional details about the insight
   */
  @IsObject()
  details: Record<string, any>;
}

/**
 * DTO for a conversation
 */
export class ConversationDto {
  /**
   * Unique identifier for the conversation
   */
  @IsUUID()
  id: string;

  /**
   * ID of the brand associated with this conversation
   */
  @IsUUID()
  brandId: string;

  /**
   * Messages in the conversation
   */
  @IsArray()
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;

  /**
   * Metadata about the conversation
   */
  @IsObject()
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  /**
   * Insights extracted from the conversation
   */
  @IsArray()
  insights: ConversationInsightDto[];

  /**
   * Engagement score for the conversation (0-1)
   */
  @IsNumber()
  engagementScore: number;

  /**
   * When the conversation was analyzed
   */
  @IsDate()
  analyzedAt: Date;

  /**
   * When the conversation was created
   */
  @IsDate()
  createdAt: Date;

  /**
   * When the conversation was last updated
   */
  @IsDate()
  updatedAt: Date;
}

/**
 * DTO for conversation trends
 */
export class ConversationTrendsDto {
  /**
   * Top intents identified in conversations
   */
  @IsArray()
  topIntents: Array<{
    category: string;
    count: number;
    averageConfidence: number;
  }>;

  /**
   * Top topics identified in conversations
   */
  @IsArray()
  topTopics: Array<{
    name: string;
    count: number;
    averageRelevance: number;
  }>;

  /**
   * Engagement trend over time
   */
  @IsArray()
  engagementTrend: Array<{
    date: Date;
    averageEngagement: number;
  }>;

  /**
   * Common actions identified in conversations
   */
  @IsArray()
  commonActions: Array<{
    type: string;
    count: number;
    averageConfidence: number;
  }>;
} 