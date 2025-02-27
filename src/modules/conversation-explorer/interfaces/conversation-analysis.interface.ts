/**
 * Interface for a message in a conversation
 */
export interface Message {
  /**
   * The role of the message sender
   */
  role: 'user' | 'assistant';
  
  /**
   * The content of the message
   */
  content: string;
  
  /**
   * When the message was sent
   */
  timestamp: Date;
}

/**
 * Interface for an intent detected in a conversation
 */
export interface Intent {
  /**
   * The category of the intent
   */
  category: string;
  
  /**
   * The confidence score for this intent (0-1)
   */
  confidence: number;
  
  /**
   * Additional context for this intent
   */
  context: Record<string, any>;
}

/**
 * Interface for sentiment analysis of a conversation
 */
export interface Sentiment {
  /**
   * The overall sentiment score (-1 to 1)
   */
  score: number;
  
  /**
   * The magnitude of the sentiment (0 to infinity)
   */
  magnitude: number;
}

/**
 * Interface for a topic detected in a conversation
 */
export interface Topic {
  /**
   * The name of the topic
   */
  name: string;
  
  /**
   * The relevance score for this topic (0-1)
   */
  relevance: number;
}

/**
 * Interface for an action detected in a conversation
 */
export interface Action {
  /**
   * The type of action
   */
  type: string;
  
  /**
   * The confidence score for this action (0-1)
   */
  confidence: number;
}

/**
 * Interface for NLP analysis of a conversation
 */
export interface NLPAnalysis {
  /**
   * Intents detected in the conversation
   */
  intents: Intent[];
  
  /**
   * Sentiment analysis of the conversation
   */
  sentiment: Sentiment;
  
  /**
   * Topics detected in the conversation
   */
  topics: Topic[];
  
  /**
   * Actions detected in the conversation
   */
  actions: Action[];
}

/**
 * Interface for a top intent in conversation trends
 */
export interface TopIntent {
  /**
   * The category of the intent
   */
  category: string;
  
  /**
   * How many times this intent was detected
   */
  count: number;
  
  /**
   * The average confidence score for this intent
   */
  averageConfidence: number;
}

/**
 * Interface for a top topic in conversation trends
 */
export interface TopTopic {
  /**
   * The name of the topic
   */
  name: string;
  
  /**
   * How many times this topic was detected
   */
  count: number;
  
  /**
   * The average relevance score for this topic
   */
  averageRelevance: number;
}

/**
 * Interface for an engagement trend data point
 */
export interface EngagementTrend {
  /**
   * The date of the trend data point
   */
  date: Date;
  
  /**
   * The average engagement score for that date
   */
  averageEngagement: number;
}

/**
 * Interface for a common action in conversation trends
 */
export interface CommonAction {
  /**
   * The type of action
   */
  type: string;
  
  /**
   * How many times this action was detected
   */
  count: number;
  
  /**
   * The average confidence score for this action
   */
  averageConfidence: number;
}

/**
 * Interface for conversation trends
 */
export interface ConversationTrends {
  /**
   * Top intents detected across conversations
   */
  topIntents: TopIntent[];
  
  /**
   * Top topics identified across conversations
   */
  topTopics: TopTopic[];
  
  /**
   * Engagement trend over time
   */
  engagementTrend: EngagementTrend[];
  
  /**
   * Common actions identified across conversations
   */
  commonActions: CommonAction[];
}

/**
 * Options for retrieving trends
 */
export interface TrendOptions {
  /**
   * Start date for the trend
   */
  startDate: Date;
  
  /**
   * End date for the trend
   */
  endDate: Date;
} 