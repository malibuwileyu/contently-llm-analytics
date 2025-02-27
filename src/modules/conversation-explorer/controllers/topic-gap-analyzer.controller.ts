import { Controller, Get, Post, Body, Query, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TopicGapAnalyzerService } from '../services/topic-gap-analyzer.service';
import { 
  TopicGapAnalysisOptionsDto, 
  TopicGapAnalysisResultsDto, 
  AnalyzeTopicGapsDto 
} from '../dto/topic-gap.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * Controller for topic gap analysis
 */
@ApiTags('topic-gaps')
@Controller('api/topic-gaps')
@UseGuards(AuthGuard('jwt'))
export class TopicGapAnalyzerController {
  private readonly logger = new Logger(TopicGapAnalyzerController.name);

  constructor(
    private readonly topicGapAnalyzerService: TopicGapAnalyzerService
  ) {}

  /**
   * Analyze topic gaps for a specific brand
   */
  @Post('analyze')
  @ApiOperation({ summary: 'Analyze topic gaps for a brand' })
  @ApiResponse({
    status: 200,
    description: 'Topic gap analysis results',
    type: TopicGapAnalysisResultsDto
  })
  async analyzeTopicGaps(
    @Body() analyzeDto: AnalyzeTopicGapsDto
  ): Promise<TopicGapAnalysisResultsDto> {
    this.logger.debug(`Analyzing topic gaps for brand: ${analyzeDto.brandId}`);
    
    const result = await this.topicGapAnalyzerService.analyzeTopicGaps(
      analyzeDto.brandId,
      analyzeDto.options ? {
        startDate: analyzeDto.options.startDate ? new Date(analyzeDto.options.startDate) : undefined,
        endDate: analyzeDto.options.endDate ? new Date(analyzeDto.options.endDate) : undefined,
        minFrequency: analyzeDto.options.minFrequency,
        minGapScore: analyzeDto.options.minGapScore,
        limit: analyzeDto.options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      gaps: result.gaps,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalConversationsAnalyzed: result.totalConversationsAnalyzed
    };
  }

  /**
   * Get topic gaps for a specific brand
   */
  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get topic gaps for a brand' })
  @ApiParam({
    name: 'brandId',
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for the analysis',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for the analysis',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @ApiQuery({
    name: 'minFrequency',
    description: 'Minimum frequency threshold for topics',
    required: false,
    example: 3
  })
  @ApiQuery({
    name: 'minGapScore',
    description: 'Minimum gap score threshold',
    required: false,
    example: 0.5
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of gaps to return',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Topic gap analysis results',
    type: TopicGapAnalysisResultsDto
  })
  async getTopicGaps(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minFrequency') minFrequency?: number,
    @Query('minGapScore') minGapScore?: number,
    @Query('limit') limit?: number
  ): Promise<TopicGapAnalysisResultsDto> {
    this.logger.debug(`Getting topic gaps for brand: ${brandId}`);
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minFrequency: minFrequency ? Number(minFrequency) : undefined,
      minGapScore: minGapScore ? Number(minGapScore) : undefined,
      limit: limit ? Number(limit) : undefined
    };
    
    const result = await this.topicGapAnalyzerService.analyzeTopicGaps(brandId, options);
    
    // Convert Date objects to ISO strings for the response
    return {
      gaps: result.gaps,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalConversationsAnalyzed: result.totalConversationsAnalyzed
    };
  }
} 