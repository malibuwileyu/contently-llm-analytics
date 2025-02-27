/**
 * Interface for sentiment analysis results
 */
export interface SentimentAnalysis {
  /**
   * Overall sentiment score from -1 (negative) to 1 (positive)
   */
  score: number;
  
  /**
   * Magnitude of sentiment (strength/intensity)
   * Higher values indicate stronger sentiment regardless of polarity
   */
  magnitude: number;
  
  /**
   * Specific aspects/topics mentioned in the content with their sentiment scores
   */
  aspects: Array<{
    /**
     * The topic or aspect being discussed
     */
    topic: string;
    
    /**
     * Sentiment score for this specific aspect from -1 (negative) to 1 (positive)
     */
    score: number;
  }>;
}

/**
 * Interface for sentiment trend data
 */
export interface SentimentTrend {
  /**
   * Date of the trend point
   */
  date: Date;
  
  /**
   * Average sentiment for that date
   */
  averageSentiment: number;
}

/**
 * Interface for brand health metrics
 */
export interface BrandHealth {
  /**
   * Overall sentiment score across all mentions
   */
  overallSentiment: number;
  
  /**
   * Sentiment trend over time
   */
  trend: SentimentTrend[];
  
  /**
   * Total number of mentions
   */
  mentionCount: number;
  
  /**
   * Top citations by authority
   */
  topCitations?: Array<{
    source: string;
    authority: number;
  }>;
}

/**
 * Interface for sentiment analysis results
 */
export interface SentimentAnalysisResult {
  /**
   * The sentiment score (-1 to 1)
   * Negative values indicate negative sentiment
   * Positive values indicate positive sentiment
   */
  sentiment: number;
  
  /**
   * The magnitude of the sentiment (0 to +inf)
   * Higher values indicate stronger sentiment
   */
  magnitude: number;
} 