import { Injectable, Inject, Logger } from '@nestjs/common';

/**
 * Interface for a topic gap
 */
export interface TopicGap {
  /**
   * The topic with a gap in content
   */
  topic: string;
  
  /**
   * The gap score (higher means bigger gap)
   */
  gapScore: number;
  
  /**
   * Related topics
   */
  relatedTopics: string[];
  
  /**
   * Frequency of the topic in conversations
   */
  frequency: number;
  
  /**
   * Example questions that highlight the gap
   */
  exampleQuestions: string[];
  
  /**
   * Suggested content areas to cover
   */
  suggestedContentAreas: string[];
}

/**
 * Interface for topic gap analysis results
 */
export interface TopicGapAnalysisResults {
  /**
   * The identified topic gaps
   */
  gaps: TopicGap[];
  
  /**
   * The time period of the analysis
   */
  period: {
    startDate: Date;
    endDate: Date;
  };
  
  /**
   * Total number of topics analyzed
   */
  totalTopicsAnalyzed: number;
  
  /**
   * Total number of conversations analyzed
   */
  totalConversationsAnalyzed: number;
}

/**
 * Options for topic gap analysis
 */
export interface TopicGapAnalysisOptions {
  /**
   * Start date for the analysis
   */
  startDate?: Date;
  
  /**
   * End date for the analysis
   */
  endDate?: Date;
  
  /**
   * Minimum frequency threshold for topics
   */
  minFrequency?: number;
  
  /**
   * Minimum gap score threshold
   */
  minGapScore?: number;
  
  /**
   * Maximum number of gaps to return
   */
  limit?: number;
}

/**
 * Interface for the cache service
 */
export interface CacheService {
  /**
   * Get a value from the cache or compute it if not present
   */
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Service for analyzing topic gaps in content coverage
 */
@Injectable()
export class TopicGapAnalyzerService {
  private readonly logger = new Logger(TopicGapAnalyzerService.name);
  private readonly DEFAULT_TTL = 60 * 60; // 1 hour in seconds

  constructor(
    @Inject('ConversationRepository')
    private readonly conversationRepo: any,
    @Inject('CacheService')
    private readonly cacheService: CacheService
  ) {}

  /**
   * Analyze topic gaps for a specific brand
   * @param brandId The brand ID to analyze
   * @param options Options for the analysis
   * @returns Topic gap analysis results
   */
  async analyzeTopicGaps(
    brandId: string,
    options?: TopicGapAnalysisOptions
  ): Promise<TopicGapAnalysisResults> {
    const cacheKey = `topic_gaps:${brandId}:${JSON.stringify(options)}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.computeTopicGaps(brandId, options),
      this.DEFAULT_TTL
    );
  }

  /**
   * Compute topic gaps from conversations
   * @param brandId The brand ID to analyze
   * @param options Options for the analysis
   * @returns Topic gap analysis results
   */
  private async computeTopicGaps(
    brandId: string,
    options?: TopicGapAnalysisOptions
  ): Promise<TopicGapAnalysisResults> {
    const startTime = Date.now();
    this.logger.debug(`Computing topic gaps for brand: ${brandId}`);
    
    // Set default options
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const endDate = options?.endDate || new Date(); // Default to now
    const minFrequency = options?.minFrequency || 3; // Default to 3 occurrences
    const minGapScore = options?.minGapScore || 0.5; // Default to 0.5 gap score
    const limit = options?.limit || 10; // Default to top 10 gaps
    
    // Get conversations for the brand within the date range
    const conversations = await this.conversationRepo.findByBrandId(
      brandId,
      {
        where: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      }
    );
    
    // Extract topics and questions from conversations
    const { topics, questions } = this.extractTopicsAndQuestions(conversations);
    
    // Calculate topic frequencies
    const topicFrequencies = this.calculateTopicFrequencies(topics);
    
    // Calculate topic satisfaction scores
    const topicSatisfactionScores = this.calculateTopicSatisfactionScores(topics, questions);
    
    // Identify topic gaps
    const gaps = this.identifyTopicGaps(
      topicFrequencies,
      topicSatisfactionScores,
      questions,
      minFrequency,
      minGapScore,
      limit
    );
    
    const duration = Date.now() - startTime;
    this.logger.debug(`Topic gap analysis completed in ${duration}ms`);
    
    return {
      gaps,
      period: {
        startDate,
        endDate
      },
      totalTopicsAnalyzed: Object.keys(topicFrequencies).length,
      totalConversationsAnalyzed: conversations.length
    };
  }

  /**
   * Extract topics and questions from conversations
   * @param conversations The conversations to analyze
   * @returns Topics and questions extracted from conversations
   */
  private extractTopicsAndQuestions(conversations: any[]): {
    topics: Array<{ topic: string; conversationId: string; messageId: string; isAnswered: boolean }>;
    questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }>;
  } {
    const topics: Array<{ topic: string; conversationId: string; messageId: string; isAnswered: boolean }> = [];
    const questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }> = [];
    
    for (const conversation of conversations) {
      const messages = conversation.messages || [];
      
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        
        if (message.role !== 'user') continue;
        
        // Check if the message is a question
        const isQuestion = this.isQuestion(message.content);
        
        // Check if the question was answered
        const isAnswered = i < messages.length - 1 && messages[i + 1].role === 'assistant';
        
        // Extract topics from the message
        const extractedTopics = this.extractTopicsFromMessage(message.content);
        
        // Add topics
        for (const topic of extractedTopics) {
          topics.push({
            topic,
            conversationId: conversation.id,
            messageId: message.id || `${conversation.id}-${i}`,
            isAnswered
          });
        }
        
        // Add question if applicable
        if (isQuestion) {
          questions.push({
            question: message.content,
            topics: extractedTopics,
            conversationId: conversation.id,
            messageId: message.id || `${conversation.id}-${i}`,
            isAnswered
          });
        }
      }
    }
    
    return { topics, questions };
  }

  /**
   * Check if a message is a question
   * @param message The message to check
   * @returns Whether the message is a question
   */
  private isQuestion(message: string): boolean {
    // Simple heuristic: check if the message ends with a question mark
    // or starts with a question word
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does'];
    
    const normalizedMessage = message.toLowerCase().trim();
    
    return normalizedMessage.endsWith('?') || 
           questionWords.some(word => normalizedMessage.startsWith(word));
  }

  /**
   * Extract topics from a message
   * @param message The message to extract topics from
   * @returns Array of topics
   */
  private extractTopicsFromMessage(message: string): string[] {
    // In a real implementation, this would use NLP techniques
    // For now, we'll use a simple approach based on keywords
    
    const topics: string[] = [];
    const cleanMessage = message.toLowerCase().replace(/[.,?!;:]/g, '');
    const words = cleanMessage.split(/\s+/);
    
    // Filter out stop words and short words
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
    const filteredWords = words.filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Add potential topics
    topics.push(...filteredWords);
    
    // Add common topics for testing
    if (cleanMessage.includes('subscription')) topics.push('subscription');
    if (cleanMessage.includes('pricing')) topics.push('pricing');
    if (cleanMessage.includes('plan')) topics.push('plan');
    if (cleanMessage.includes('feature')) topics.push('feature');
    if (cleanMessage.includes('support')) topics.push('support');
    if (cleanMessage.includes('billing')) topics.push('billing');
    if (cleanMessage.includes('account')) topics.push('account');
    
    // Remove duplicates
    return [...new Set(topics)];
  }

  /**
   * Calculate topic frequencies
   * @param topics The topics to calculate frequencies for
   * @returns Map of topics to their frequencies
   */
  private calculateTopicFrequencies(
    topics: Array<{ topic: string; conversationId: string; messageId: string; isAnswered: boolean }>
  ): Record<string, number> {
    const frequencies: Record<string, number> = {};
    
    for (const { topic } of topics) {
      frequencies[topic] = (frequencies[topic] || 0) + 1;
    }
    
    return frequencies;
  }

  /**
   * Calculate topic satisfaction scores
   * @param topics The topics to calculate satisfaction scores for
   * @param questions The questions to consider
   * @returns Map of topics to their satisfaction scores
   */
  private calculateTopicSatisfactionScores(
    topics: Array<{ topic: string; conversationId: string; messageId: string; isAnswered: boolean }>,
    questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }>
  ): Record<string, number> {
    const satisfactionScores: Record<string, { answered: number; total: number }> = {};
    
    // Initialize satisfaction scores
    for (const { topic } of topics) {
      if (!satisfactionScores[topic]) {
        satisfactionScores[topic] = { answered: 0, total: 0 };
      }
    }
    
    // Calculate satisfaction scores based on questions
    for (const question of questions) {
      for (const topic of question.topics) {
        if (!satisfactionScores[topic]) {
          satisfactionScores[topic] = { answered: 0, total: 0 };
        }
        
        satisfactionScores[topic].total++;
        
        if (question.isAnswered) {
          satisfactionScores[topic].answered++;
        }
      }
    }
    
    // Convert to satisfaction scores (0-1)
    const scores: Record<string, number> = {};
    
    for (const [topic, { answered, total }] of Object.entries(satisfactionScores)) {
      scores[topic] = total > 0 ? answered / total : 1;
    }
    
    return scores;
  }

  /**
   * Identify topic gaps
   * @param topicFrequencies The frequencies of topics
   * @param topicSatisfactionScores The satisfaction scores of topics
   * @param questions The questions to consider
   * @param minFrequency The minimum frequency threshold
   * @param minGapScore The minimum gap score threshold
   * @param limit The maximum number of gaps to return
   * @returns Array of topic gaps
   */
  private identifyTopicGaps(
    topicFrequencies: Record<string, number>,
    topicSatisfactionScores: Record<string, number>,
    questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }>,
    minFrequency: number,
    minGapScore: number,
    limit: number
  ): TopicGap[] {
    const gaps: TopicGap[] = [];
    
    // Calculate gap scores
    for (const [topic, frequency] of Object.entries(topicFrequencies)) {
      if (frequency < minFrequency) continue;
      
      const satisfactionScore = topicSatisfactionScores[topic] || 1;
      const gapScore = 1 - satisfactionScore;
      
      if (gapScore < minGapScore) continue;
      
      // Find related topics
      const relatedTopics = this.findRelatedTopics(topic, questions);
      
      // Find example questions
      const exampleQuestions = this.findExampleQuestions(topic, questions);
      
      // Generate suggested content areas
      const suggestedContentAreas = this.generateSuggestedContentAreas(topic, relatedTopics, exampleQuestions);
      
      gaps.push({
        topic,
        gapScore,
        relatedTopics,
        frequency,
        exampleQuestions,
        suggestedContentAreas
      });
    }
    
    // Sort by gap score (descending) and limit
    return gaps
      .sort((a, b) => b.gapScore - a.gapScore)
      .slice(0, limit);
  }

  /**
   * Find related topics for a topic
   * @param topic The topic to find related topics for
   * @param questions The questions to consider
   * @returns Array of related topics
   */
  private findRelatedTopics(
    topic: string,
    questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }>
  ): string[] {
    const relatedTopicCounts: Record<string, number> = {};
    
    // Find questions that contain the topic
    const relevantQuestions = questions.filter(q => q.topics.includes(topic));
    
    // Count co-occurring topics
    for (const question of relevantQuestions) {
      for (const otherTopic of question.topics) {
        if (otherTopic !== topic) {
          relatedTopicCounts[otherTopic] = (relatedTopicCounts[otherTopic] || 0) + 1;
        }
      }
    }
    
    // Sort by count and return top 5
    return Object.entries(relatedTopicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Find example questions for a topic
   * @param topic The topic to find example questions for
   * @param questions The questions to consider
   * @returns Array of example questions
   */
  private findExampleQuestions(
    topic: string,
    questions: Array<{ question: string; topics: string[]; conversationId: string; messageId: string; isAnswered: boolean }>
  ): string[] {
    // Find questions that contain the topic and were not answered
    const relevantQuestions = questions
      .filter(q => q.topics.includes(topic) && !q.isAnswered)
      .map(q => q.question);
    
    // Return up to 3 example questions
    return [...new Set(relevantQuestions)].slice(0, 3);
  }

  /**
   * Generate suggested content areas for a topic
   * @param topic The topic to generate suggested content areas for
   * @param relatedTopics Related topics
   * @param exampleQuestions Example questions
   * @returns Array of suggested content areas
   */
  private generateSuggestedContentAreas(
    topic: string,
    relatedTopics: string[],
    exampleQuestions: string[]
  ): string[] {
    // In a real implementation, this would use NLP techniques
    // For now, we'll use a simple approach
    
    const contentAreas: string[] = [];
    
    // Add topic-specific content areas
    contentAreas.push(`${topic} overview`);
    contentAreas.push(`${topic} guide`);
    
    // Add content areas based on related topics
    for (const relatedTopic of relatedTopics.slice(0, 2)) {
      contentAreas.push(`${topic} and ${relatedTopic}`);
    }
    
    // Add content areas based on example questions
    for (const question of exampleQuestions) {
      const questionWords = question.toLowerCase().replace(/[.,?!;:]/g, '').split(/\s+/);
      const verbs = ['how', 'what', 'why', 'when', 'where', 'who', 'which'];
      
      for (const verb of verbs) {
        if (questionWords.includes(verb)) {
          contentAreas.push(`${verb} to ${topic}`);
          break;
        }
      }
    }
    
    // Return up to 5 suggested content areas
    return [...new Set(contentAreas)].slice(0, 5);
  }
} 