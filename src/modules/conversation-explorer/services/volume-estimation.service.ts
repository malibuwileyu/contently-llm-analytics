import { Injectable, Inject, Logger } from '@nestjs/common';

/**
 * Interface for volume metrics
 */
export interface VolumeMetrics {
  /**
   * Total number of conversations
   */
  totalConversations: number;
  
  /**
   * Total number of messages
   */
  totalMessages: number;
  
  /**
   * Average messages per conversation
   */
  avgMessagesPerConversation: number;
  
  /**
   * Average user messages per conversation
   */
  avgUserMessagesPerConversation: number;
  
  /**
   * Average assistant messages per conversation
   */
  avgAssistantMessagesPerConversation: number;
  
  /**
   * Average conversation duration in seconds
   */
  avgConversationDuration: number;
}

/**
 * Interface for volume by time period
 */
export interface VolumeByTimePeriod {
  /**
   * The time period (e.g., "2023-01-01" for daily, "2023-01" for monthly)
   */
  period: string;
  
  /**
   * Number of conversations in this period
   */
  conversationCount: number;
  
  /**
   * Number of messages in this period
   */
  messageCount: number;
  
  /**
   * Number of user messages in this period
   */
  userMessageCount: number;
  
  /**
   * Number of assistant messages in this period
   */
  assistantMessageCount: number;
}

/**
 * Interface for volume estimation results
 */
export interface VolumeEstimationResults {
  /**
   * Overall volume metrics
   */
  metrics: VolumeMetrics;
  
  /**
   * Volume by day
   */
  byDay: VolumeByTimePeriod[];
  
  /**
   * Volume by week
   */
  byWeek: VolumeByTimePeriod[];
  
  /**
   * Volume by month
   */
  byMonth: VolumeByTimePeriod[];
  
  /**
   * The time period of the analysis
   */
  period: {
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Options for volume estimation
 */
export interface VolumeEstimationOptions {
  /**
   * Start date for the estimation
   */
  startDate?: Date;
  
  /**
   * End date for the estimation
   */
  endDate?: Date;
  
  /**
   * Whether to include daily breakdown
   */
  includeDaily?: boolean;
  
  /**
   * Whether to include weekly breakdown
   */
  includeWeekly?: boolean;
  
  /**
   * Whether to include monthly breakdown
   */
  includeMonthly?: boolean;
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
 * Service for estimating conversation volume
 */
@Injectable()
export class VolumeEstimationService {
  private readonly logger = new Logger(VolumeEstimationService.name);
  private readonly DEFAULT_TTL = 30 * 60; // 30 minutes in seconds

  constructor(
    @Inject('ConversationRepository')
    private readonly conversationRepo: any,
    @Inject('CacheService')
    private readonly cacheService: CacheService
  ) {}

  /**
   * Estimate conversation volume for a specific brand
   * @param brandId The brand ID to analyze
   * @param options Options for the estimation
   * @returns Volume estimation results
   */
  async estimateVolume(
    brandId: string,
    options?: VolumeEstimationOptions
  ): Promise<VolumeEstimationResults> {
    const cacheKey = `volume_estimation:${brandId}:${JSON.stringify(options)}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.computeVolumeEstimation(brandId, options),
      this.DEFAULT_TTL
    );
  }

  /**
   * Compute volume estimation from conversations
   * @param brandId The brand ID to analyze
   * @param options Options for the estimation
   * @returns Volume estimation results
   */
  private async computeVolumeEstimation(
    brandId: string,
    options?: VolumeEstimationOptions
  ): Promise<VolumeEstimationResults> {
    const startTime = Date.now();
    this.logger.debug(`Computing volume estimation for brand: ${brandId}`);
    
    // Set default options
    const startDate = options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to 30 days ago
    const endDate = options?.endDate || new Date(); // Default to now
    const includeDaily = options?.includeDaily !== undefined ? options.includeDaily : true;
    const includeWeekly = options?.includeWeekly !== undefined ? options.includeWeekly : true;
    const includeMonthly = options?.includeMonthly !== undefined ? options.includeMonthly : true;
    
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
    
    // Calculate overall metrics
    const metrics = this.calculateOverallMetrics(conversations);
    
    // Calculate volume by time period
    const byDay = includeDaily ? this.calculateVolumeByDay(conversations) : [];
    const byWeek = includeWeekly ? this.calculateVolumeByWeek(conversations) : [];
    const byMonth = includeMonthly ? this.calculateVolumeByMonth(conversations) : [];
    
    const duration = Date.now() - startTime;
    this.logger.debug(`Volume estimation completed in ${duration}ms`);
    
    return {
      metrics,
      byDay,
      byWeek,
      byMonth,
      period: {
        startDate,
        endDate
      }
    };
  }

  /**
   * Calculate overall volume metrics
   * @param conversations The conversations to analyze
   * @returns Overall volume metrics
   */
  private calculateOverallMetrics(conversations: any[]): VolumeMetrics {
    const totalConversations = conversations.length;
    
    let totalMessages = 0;
    let totalUserMessages = 0;
    let totalAssistantMessages = 0;
    let totalDuration = 0;
    
    for (const conversation of conversations) {
      const messages = conversation.messages || [];
      totalMessages += messages.length;
      
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const assistantMessages = messages.filter((m: any) => m.role === 'assistant');
      
      totalUserMessages += userMessages.length;
      totalAssistantMessages += assistantMessages.length;
      
      // Calculate conversation duration if timestamps are available
      if (messages.length > 0) {
        const firstMessage = messages[0];
        const lastMessage = messages[messages.length - 1];
        
        if (firstMessage.timestamp && lastMessage.timestamp) {
          const duration = new Date(lastMessage.timestamp).getTime() - new Date(firstMessage.timestamp).getTime();
          totalDuration += duration / 1000; // Convert to seconds
        }
      }
    }
    
    return {
      totalConversations,
      totalMessages,
      avgMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
      avgUserMessagesPerConversation: totalConversations > 0 ? totalUserMessages / totalConversations : 0,
      avgAssistantMessagesPerConversation: totalConversations > 0 ? totalAssistantMessages / totalConversations : 0,
      avgConversationDuration: totalConversations > 0 ? totalDuration / totalConversations : 0
    };
  }

  /**
   * Calculate volume by day
   * @param conversations The conversations to analyze
   * @returns Volume by day
   */
  private calculateVolumeByDay(conversations: any[]): VolumeByTimePeriod[] {
    const volumeByDay = new Map<string, {
      conversationCount: number;
      messageCount: number;
      userMessageCount: number;
      assistantMessageCount: number;
    }>();
    
    for (const conversation of conversations) {
      const date = new Date(conversation.createdAt);
      const day = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      if (!volumeByDay.has(day)) {
        volumeByDay.set(day, {
          conversationCount: 0,
          messageCount: 0,
          userMessageCount: 0,
          assistantMessageCount: 0
        });
      }
      
      const dayStats = volumeByDay.get(day)!;
      dayStats.conversationCount++;
      
      const messages = conversation.messages || [];
      dayStats.messageCount += messages.length;
      dayStats.userMessageCount += messages.filter((m: any) => m.role === 'user').length;
      dayStats.assistantMessageCount += messages.filter((m: any) => m.role === 'assistant').length;
    }
    
    // Convert to array and sort by day
    return Array.from(volumeByDay.entries())
      .map(([day, stats]) => ({
        period: day,
        ...stats
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calculate volume by week
   * @param conversations The conversations to analyze
   * @returns Volume by week
   */
  private calculateVolumeByWeek(conversations: any[]): VolumeByTimePeriod[] {
    const volumeByWeek = new Map<string, {
      conversationCount: number;
      messageCount: number;
      userMessageCount: number;
      assistantMessageCount: number;
    }>();
    
    for (const conversation of conversations) {
      const date = new Date(conversation.createdAt);
      const week = this.getWeekIdentifier(date);
      
      if (!volumeByWeek.has(week)) {
        volumeByWeek.set(week, {
          conversationCount: 0,
          messageCount: 0,
          userMessageCount: 0,
          assistantMessageCount: 0
        });
      }
      
      const weekStats = volumeByWeek.get(week)!;
      weekStats.conversationCount++;
      
      const messages = conversation.messages || [];
      weekStats.messageCount += messages.length;
      weekStats.userMessageCount += messages.filter((m: any) => m.role === 'user').length;
      weekStats.assistantMessageCount += messages.filter((m: any) => m.role === 'assistant').length;
    }
    
    // Convert to array and sort by week
    return Array.from(volumeByWeek.entries())
      .map(([week, stats]) => ({
        period: week,
        ...stats
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Calculate volume by month
   * @param conversations The conversations to analyze
   * @returns Volume by month
   */
  private calculateVolumeByMonth(conversations: any[]): VolumeByTimePeriod[] {
    const volumeByMonth = new Map<string, {
      conversationCount: number;
      messageCount: number;
      userMessageCount: number;
      assistantMessageCount: number;
    }>();
    
    for (const conversation of conversations) {
      const date = new Date(conversation.createdAt);
      const month = date.toISOString().substring(0, 7); // Format: YYYY-MM
      
      if (!volumeByMonth.has(month)) {
        volumeByMonth.set(month, {
          conversationCount: 0,
          messageCount: 0,
          userMessageCount: 0,
          assistantMessageCount: 0
        });
      }
      
      const monthStats = volumeByMonth.get(month)!;
      monthStats.conversationCount++;
      
      const messages = conversation.messages || [];
      monthStats.messageCount += messages.length;
      monthStats.userMessageCount += messages.filter((m: any) => m.role === 'user').length;
      monthStats.assistantMessageCount += messages.filter((m: any) => m.role === 'assistant').length;
    }
    
    // Convert to array and sort by month
    return Array.from(volumeByMonth.entries())
      .map(([month, stats]) => ({
        period: month,
        ...stats
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  /**
   * Get a week identifier for a date (YYYY-Www format)
   * @param date The date to get the week identifier for
   * @returns Week identifier
   */
  private getWeekIdentifier(date: Date): string {
    const year = date.getFullYear();
    
    // Calculate the week number
    const firstDayOfYear = new Date(year, 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    
    // Calculate the week number (adjust for day of week)
    const weekDay = (date.getDay() + 6) % 7; // Make Monday day 0
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() - weekDay) / 7);
    
    // Format: YYYY-Www
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
  }
} 