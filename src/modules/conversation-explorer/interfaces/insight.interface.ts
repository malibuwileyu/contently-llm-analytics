import { Conversation } from '../entities/conversation.entity';

/**
 * DTO for creating a conversation insight
 */
export interface CreateInsightDto {
  /**
   * The conversation this insight belongs to
   */
  conversation: Conversation;
  
  /**
   * The type of insight (intent, sentiment, topic, action)
   */
  type: string;
  
  /**
   * The category within the type
   */
  category: string;
  
  /**
   * The confidence score for this insight
   */
  confidence: number;
  
  /**
   * Additional details about the insight
   */
  details: Record<string, unknown>;
}

/**
 * Interface for insight search results
 */
export interface InsightSearchResult {
  /**
   * The ID of the insight
   */
  id: string;
  
  /**
   * The ID of the conversation this insight belongs to
   */
  conversationId: string;
  
  /**
   * The type of insight
   */
  type: 'intent' | 'sentiment' | 'topic' | 'action';
  
  /**
   * The category of the insight
   */
  category: string;
  
  /**
   * The confidence score for this insight (0-1)
   */
  confidence: number;
  
  /**
   * Relevance score for the search result (0-1)
   */
  relevance: number;
  
  /**
   * Snippet of the conversation context
   */
  snippet: string;
}

/**
 * Interface for insight search options
 */
export interface InsightSearchOptions {
  /**
   * The brand ID to search within
   */
  brandId: string;
  
  /**
   * The type of insights to search for
   */
  type?: 'intent' | 'sentiment' | 'topic' | 'action';
  
  /**
   * The category to filter by
   */
  category?: string;
  
  /**
   * Minimum confidence threshold (0-1)
   */
  minConfidence?: number;
  
  /**
   * Maximum number of results to return
   */
  limit?: number;
  
  /**
   * Number of results to skip
   */
  offset?: number;
} 