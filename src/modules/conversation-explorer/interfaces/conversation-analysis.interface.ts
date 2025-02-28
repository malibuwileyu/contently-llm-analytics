/**
 * Represents a message in a conversation
 */
export interface Message {
  /**
   * The role of the message sender
   */
  role: string;
  
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
 * Represents an intent detected in a conversation
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
   * Additional details about the intent
   */
  details: Record<string, unknown>;
}

/**
 * Represents sentiment analysis of a conversation
 */
export interface Sentiment {
  /**
   * The overall sentiment score (-1 to 1)
   */
  overall: number;
  
  /**
   * How sentiment changed throughout the conversation
   */
  progression: number;
  
  /**
   * Sentiment broken down by aspects
   */
  aspects: {
    aspect: string;
    score: number;
  }[];
}

/**
 * Represents a topic identified in a conversation
 */
export interface Topic {
  /**
   * The name of the topic
   */
  name: string;
  
  /**
   * How relevant the topic is to the conversation (0-1)
   */
  relevance: number;
  
  /**
   * How many times the topic was mentioned
   */
  mentions: number;
}

/**
 * Represents an action identified in a conversation
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
  
  /**
   * Context around the action
   */
  context: Record<string, unknown>;
}

/**
 * Represents the complete analysis of a conversation
 */
export interface ConversationAnalysis {
  /**
   * Intents detected in the conversation
   */
  intents: Intent[];
  
  /**
   * Sentiment analysis of the conversation
   */
  sentiment: Sentiment;
  
  /**
   * Topics identified in the conversation
   */
  topics: Topic[];
  
  /**
   * Actions identified in the conversation
   */
  actions: Action[];
}

/**
 * Represents a data point in an engagement trend
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
 * Represents a top intent in conversation trends
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
 * Represents a top topic in conversation trends
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
 * Represents a common action in conversation trends
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
 * Represents trends in conversations
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