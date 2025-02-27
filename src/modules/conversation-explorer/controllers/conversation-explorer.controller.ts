import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  HttpStatus, 
  HttpCode 
} from '@nestjs/common';
import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { AnalyzeConversationDto, TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { ConversationDto, ConversationTrendsDto, ConversationInsightDto } from '../dto/conversation-insight.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { Conversation } from '../entities/conversation.entity';
import { ConversationTrends } from '../interfaces/conversation-analysis.interface';

/**
 * Controller for the Conversation Explorer
 */
@Controller('conversation-explorer')
export class ConversationExplorerController {
  constructor(
    private readonly conversationExplorerService: ConversationExplorerService
  ) {}

  /**
   * Analyze a conversation to extract insights
   * @param data Conversation data to analyze
   * @returns Analyzed conversation with insights
   */
  @Post('analyze')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  async analyzeConversation(
    @Body() data: AnalyzeConversationDto
  ): Promise<ConversationDto> {
    const conversation = await this.conversationExplorerService.analyzeConversation(
      data
    );
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map((insight: any) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
    };
  }

  /**
   * Get trends from conversations
   * @param brandId ID of the brand
   * @param options Options for retrieving trends
   * @returns Conversation trends
   */
  @Get('trends/:brandId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getConversationTrends(
    @Param('brandId') brandId: string,
    @Query() options: TrendOptionsDto
  ): Promise<ConversationTrendsDto> {
    // Set default dates if not provided
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = options.endDate || new Date();

    const trends = await this.conversationExplorerService.getConversationTrends(
      brandId,
      { startDate, endDate }
    );

    return {
      topIntents: trends.topIntents,
      topTopics: trends.topTopics,
      engagementTrend: trends.engagementTrends,
      commonActions: trends.commonActions,
    };
  }

  /**
   * Get a conversation by ID
   * @param id ID of the conversation
   * @returns Conversation with insights
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Param('id') id: string
  ): Promise<ConversationDto> {
    const conversation = await this.conversationExplorerService['conversationRepo'].findWithInsights(id);
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map((insight: any) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
    };
  }

  /**
   * Transform a conversation entity to DTO
   * @param conversation Conversation entity
   * @returns Conversation DTO
   */
  private transformToDto(conversation: Conversation): ConversationDto {
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map(insight => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
    };
  }

  /**
   * Transform conversation trends to DTO
   * @param trends Conversation trends
   * @returns Conversation trends DTO
   */
  private transformTrendsToDto(trends: ConversationTrends): ConversationTrendsDto {
    return {
      topIntents: trends.topIntents,
      topTopics: trends.topTopics,
      engagementTrend: trends.engagementTrend,
      commonActions: trends.commonActions,
    };
  }
} 