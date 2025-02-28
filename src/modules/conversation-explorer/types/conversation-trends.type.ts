/**
 * Interface for conversation trends data
 */
export interface ConversationTrends {
  /**
   * Top intents identified across conversations
   */
  topIntents: Array<{
    category: string;
    count: number;
    averageConfidence: number;
  }>;

  /**
   * Top topics identified across conversations
   */
  topTopics: Array<{
    name: string;
    count: number;
    averageRelevance: number;
  }>;

  /**
   * Engagement trends over time
   */
  engagementTrends: Array<{
    date: Date;
    averageEngagement: number;
  }>;

  /**
   * Common actions identified across conversations
   */
  commonActions: Array<{
    type: string;
    count: number;
    averageConfidence: number;
  }>;
} 