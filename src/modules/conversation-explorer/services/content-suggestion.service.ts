import { Injectable, Inject, Logger } from '@nestjs/common';
import { TopicGapAnalyzerService } from './topic-gap-analyzer.service';
import { TopicClusteringService } from './topic-clustering.service';

/**
 * Interface for a content suggestion
 */
export interface ContentSuggestion {
  /**
   * The title of the suggested content
   */
  title: string;
  
  /**
   * The type of content (e.g., article, video, FAQ)
   */
  type: string;
  
  /**
   * The priority of the suggestion (higher means more important)
   */
  priority: number;
  
  /**
   * The topics covered by the suggestion
   */
  topics: string[];
  
  /**
   * The gap score that led to this suggestion (higher means bigger gap)
   */
  gapScore: number;
  
  /**
   * Estimated impact of creating this content (1-10)
   */
  estimatedImpact: number;
  
  /**
   * Example questions this content would answer
   */
  exampleQuestions: string[];
  
  /**
   * Suggested outline or key points to cover
   */
  suggestedOutline: string[];
}

/**
 * Interface for content suggestion results
 */
export interface ContentSuggestionResults {
  /**
   * The suggested content items
   */
  suggestions: ContentSuggestion[];
  
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
   * Total number of gaps analyzed
   */
  totalGapsAnalyzed: number;
}

/**
 * Options for content suggestion
 */
export interface ContentSuggestionOptions {
  /**
   * Start date for the analysis
   */
  startDate?: Date;
  
  /**
   * End date for the analysis
   */
  endDate?: Date;
  
  /**
   * Minimum gap score threshold
   */
  minGapScore?: number;
  
  /**
   * Content types to include
   */
  contentTypes?: string[];
  
  /**
   * Maximum number of suggestions to return
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
 * Service for suggesting content based on conversation topics and gaps
 */
@Injectable()
export class ContentSuggestionService {
  private readonly logger = new Logger(ContentSuggestionService.name);
  private readonly DEFAULT_TTL = 30 * 60; // 30 minutes in seconds
  private readonly DEFAULT_CONTENT_TYPES = ['article', 'video', 'FAQ', 'guide', 'tutorial'];

  constructor(
    @Inject('CacheService')
    private readonly cacheService: CacheService,
    private readonly topicGapAnalyzerService: TopicGapAnalyzerService,
    private readonly topicClusteringService: TopicClusteringService
  ) {}

  /**
   * Suggest content for a specific brand
   * @param brandId The brand ID to analyze
   * @param options Options for the suggestion
   * @returns Content suggestion results
   */
  async suggestContent(
    brandId: string,
    options?: ContentSuggestionOptions
  ): Promise<ContentSuggestionResults> {
    const cacheKey = `content_suggestions:${brandId}:${JSON.stringify(options)}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.generateContentSuggestions(brandId, options),
      this.DEFAULT_TTL
    );
  }

  /**
   * Generate content suggestions from topic gaps and clusters
   * @param brandId The brand ID to analyze
   * @param options Options for the suggestion
   * @returns Content suggestion results
   */
  private async generateContentSuggestions(
    brandId: string,
    options?: ContentSuggestionOptions
  ): Promise<ContentSuggestionResults> {
    const startTime = Date.now();
    this.logger.debug(`Generating content suggestions for brand: ${brandId}`);
    
    // Set default options
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const endDate = options?.endDate || new Date(); // Default to now
    const minGapScore = options?.minGapScore || 0.3; // Default to 0.3 gap score
    const contentTypes = options?.contentTypes || this.DEFAULT_CONTENT_TYPES;
    const limit = options?.limit || 10; // Default to top 10 suggestions
    
    // Get topic gaps
    const gapAnalysis = await this.topicGapAnalyzerService.analyzeTopicGaps(
      brandId,
      {
        startDate,
        endDate,
        minGapScore
      }
    );
    
    // Get topic clusters
    const clusterAnalysis = await this.topicClusteringService.clusterTopics(
      brandId,
      {
        startDate,
        endDate
      }
    );
    
    // Generate content suggestions
    const suggestions = this.createSuggestionsFromGapsAndClusters(
      gapAnalysis.gaps,
      clusterAnalysis.clusters,
      contentTypes,
      limit
    );
    
    const duration = Date.now() - startTime;
    this.logger.debug(`Content suggestion generation completed in ${duration}ms`);
    
    return {
      suggestions,
      period: {
        startDate,
        endDate
      },
      totalTopicsAnalyzed: gapAnalysis.totalTopicsAnalyzed,
      totalGapsAnalyzed: gapAnalysis.gaps.length
    };
  }

  /**
   * Create content suggestions from topic gaps and clusters
   * @param gaps The topic gaps
   * @param clusters The topic clusters
   * @param contentTypes The content types to include
   * @param limit The maximum number of suggestions to return
   * @returns Array of content suggestions
   */
  private createSuggestionsFromGapsAndClusters(
    gaps: any[],
    clusters: any[],
    contentTypes: string[],
    limit: number
  ): ContentSuggestion[] {
    const suggestions: ContentSuggestion[] = [];
    
    // Create suggestions from gaps
    for (const gap of gaps) {
      // Find related cluster
      const relatedCluster = clusters.find(cluster => 
        cluster.centralTopic === gap.topic || 
        cluster.relatedTopics.includes(gap.topic)
      );
      
      // Determine content type based on gap and cluster
      const contentType = this.determineContentType(gap, relatedCluster, contentTypes);
      
      // Generate title
      const title = this.generateTitle(gap.topic, gap.relatedTopics, contentType);
      
      // Calculate priority based on gap score and frequency
      const priority = this.calculatePriority(gap.gapScore, gap.frequency);
      
      // Calculate estimated impact
      const estimatedImpact = this.calculateEstimatedImpact(gap.gapScore, gap.frequency);
      
      // Generate suggested outline
      const suggestedOutline = this.generateSuggestedOutline(
        gap.topic,
        gap.relatedTopics,
        gap.suggestedContentAreas,
        contentType
      );
      
      suggestions.push({
        title,
        type: contentType,
        priority,
        topics: [gap.topic, ...gap.relatedTopics],
        gapScore: gap.gapScore,
        estimatedImpact,
        exampleQuestions: gap.exampleQuestions,
        suggestedOutline
      });
    }
    
    // Sort by priority (descending) and limit
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);
  }

  /**
   * Determine the best content type for a gap and cluster
   * @param gap The topic gap
   * @param cluster The related topic cluster
   * @param contentTypes The content types to choose from
   * @returns The best content type
   */
  private determineContentType(
    gap: any,
    cluster: any,
    contentTypes: string[]
  ): string {
    // In a real implementation, this would use more sophisticated logic
    // For now, we'll use a simple approach
    
    // If there are example questions, prefer FAQ
    if (gap.exampleQuestions.length > 2 && contentTypes.includes('FAQ')) {
      return 'FAQ';
    }
    
    // If the gap score is high, prefer a comprehensive guide
    if (gap.gapScore > 0.7 && contentTypes.includes('guide')) {
      return 'guide';
    }
    
    // If the topic is technical, prefer a tutorial
    const technicalTopics = ['setup', 'install', 'configure', 'integrate', 'implement', 'code', 'develop'];
    if (
      technicalTopics.some(tech => 
        gap.topic.includes(tech) || 
        gap.relatedTopics.some((topic: string) => topic.includes(tech))
      ) && 
      contentTypes.includes('tutorial')
    ) {
      return 'tutorial';
    }
    
    // Default to article
    return contentTypes.includes('article') ? 'article' : contentTypes[0];
  }

  /**
   * Generate a title for a content suggestion
   * @param topic The main topic
   * @param relatedTopics Related topics
   * @param contentType The content type
   * @returns A title for the content
   */
  private generateTitle(
    topic: string,
    relatedTopics: string[],
    contentType: string
  ): string {
    // In a real implementation, this would use NLG techniques
    // For now, we'll use templates
    
    const templates: Record<string, string[]> = {
      article: [
        `Understanding ${topic}`,
        `Everything You Need to Know About ${topic}`,
        `${topic} Explained: A Comprehensive Guide`
      ],
      video: [
        `${topic} in Action: Video Tutorial`,
        `Visual Guide to ${topic}`,
        `${topic} Explained in 5 Minutes`
      ],
      FAQ: [
        `Frequently Asked Questions About ${topic}`,
        `${topic} FAQ: Answers to Common Questions`,
        `Top Questions About ${topic} Answered`
      ],
      guide: [
        `Complete Guide to ${topic}`,
        `${topic} Guide: From Basics to Advanced`,
        `The Ultimate ${topic} Handbook`
      ],
      tutorial: [
        `Step-by-Step ${topic} Tutorial`,
        `How to Master ${topic}`,
        `${topic} Tutorial for Beginners`
      ]
    };
    
    // Get templates for the content type
    const typeTemplates = templates[contentType] || templates.article;
    
    // Select a random template
    const template = typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
    
    return template;
  }

  /**
   * Calculate priority for a content suggestion
   * @param gapScore The gap score
   * @param frequency The topic frequency
   * @returns The priority score
   */
  private calculatePriority(
    gapScore: number,
    frequency: number
  ): number {
    // Priority is a combination of gap score and frequency
    // Higher gap score and higher frequency means higher priority
    return gapScore * Math.log10(frequency + 1) * 10;
  }

  /**
   * Calculate estimated impact for a content suggestion
   * @param gapScore The gap score
   * @param frequency The topic frequency
   * @returns The estimated impact (1-10)
   */
  private calculateEstimatedImpact(
    gapScore: number,
    frequency: number
  ): number {
    // Impact is a combination of gap score and frequency
    // Scale to 1-10 range
    const impact = gapScore * Math.log10(frequency + 1) * 10;
    return Math.min(10, Math.max(1, Math.round(impact)));
  }

  /**
   * Generate a suggested outline for a content suggestion
   * @param topic The main topic
   * @param relatedTopics Related topics
   * @param suggestedContentAreas Suggested content areas
   * @param contentType The content type
   * @returns A suggested outline
   */
  private generateSuggestedOutline(
    topic: string,
    relatedTopics: string[],
    suggestedContentAreas: string[],
    contentType: string
  ): string[] {
    // In a real implementation, this would use NLG techniques
    // For now, we'll use templates
    
    const outline: string[] = [];
    
    // Add introduction
    outline.push(`Introduction to ${topic}`);
    
    // Add content areas
    for (const area of suggestedContentAreas) {
      outline.push(area);
    }
    
    // Add related topics
    for (const relatedTopic of relatedTopics.slice(0, 3)) {
      outline.push(`${topic} and ${relatedTopic}`);
    }
    
    // Add content type specific sections
    switch (contentType) {
      case 'article':
        outline.push(`Best practices for ${topic}`);
        outline.push(`Common misconceptions about ${topic}`);
        break;
      case 'video':
        outline.push(`${topic} demonstration`);
        outline.push(`Visual examples of ${topic}`);
        break;
      case 'FAQ':
        outline.push(`Common questions about ${topic}`);
        outline.push(`Troubleshooting ${topic} issues`);
        break;
      case 'guide':
        outline.push(`Getting started with ${topic}`);
        outline.push(`Advanced ${topic} techniques`);
        outline.push(`${topic} best practices`);
        break;
      case 'tutorial':
        outline.push(`Prerequisites for ${topic}`);
        outline.push(`Step-by-step ${topic} walkthrough`);
        outline.push(`${topic} examples`);
        break;
    }
    
    // Add conclusion
    outline.push(`Conclusion and next steps`);
    
    return outline;
  }
} 