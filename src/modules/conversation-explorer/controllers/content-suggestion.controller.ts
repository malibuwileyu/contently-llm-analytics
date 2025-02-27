import { Controller, Get, Post, Body, Query, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import { 
  ContentSuggestionOptionsDto, 
  ContentSuggestionResultsDto, 
  SuggestContentDto 
} from '../dto/content-suggestion.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * Controller for content suggestions
 */
@ApiTags('content-suggestions')
@Controller('api/content-suggestions')
@UseGuards(AuthGuard('jwt'))
export class ContentSuggestionController {
  private readonly logger = new Logger(ContentSuggestionController.name);

  constructor(
    private readonly contentSuggestionService: ContentSuggestionService
  ) {}

  /**
   * Suggest content for a specific brand
   */
  @Post('suggest')
  @ApiOperation({ summary: 'Suggest content for a brand' })
  @ApiResponse({
    status: 200,
    description: 'Content suggestion results',
    type: ContentSuggestionResultsDto
  })
  async suggestContent(
    @Body() suggestDto: SuggestContentDto
  ): Promise<ContentSuggestionResultsDto> {
    this.logger.debug(`Suggesting content for brand: ${suggestDto.brandId}`);
    
    const result = await this.contentSuggestionService.suggestContent(
      suggestDto.brandId,
      suggestDto.options ? {
        startDate: suggestDto.options.startDate ? new Date(suggestDto.options.startDate) : undefined,
        endDate: suggestDto.options.endDate ? new Date(suggestDto.options.endDate) : undefined,
        minGapScore: suggestDto.options.minGapScore,
        contentTypes: suggestDto.options.contentTypes,
        limit: suggestDto.options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      suggestions: result.suggestions,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalGapsAnalyzed: result.totalGapsAnalyzed
    };
  }

  /**
   * Get content suggestions for a specific brand
   */
  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get content suggestions for a brand' })
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
    name: 'minGapScore',
    description: 'Minimum gap score threshold',
    required: false,
    example: 0.3
  })
  @ApiQuery({
    name: 'contentTypes',
    description: 'Content types to include (comma-separated)',
    required: false,
    example: 'article,video,FAQ'
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of suggestions to return',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Content suggestion results',
    type: ContentSuggestionResultsDto
  })
  async getContentSuggestions(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minGapScore') minGapScore?: number,
    @Query('contentTypes') contentTypes?: string,
    @Query('limit') limit?: number
  ): Promise<ContentSuggestionResultsDto> {
    this.logger.debug(`Getting content suggestions for brand: ${brandId}`);
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minGapScore: minGapScore ? Number(minGapScore) : undefined,
      contentTypes: contentTypes ? contentTypes.split(',') : undefined,
      limit: limit ? Number(limit) : undefined
    };
    
    const result = await this.contentSuggestionService.suggestContent(brandId, options);
    
    // Convert Date objects to ISO strings for the response
    return {
      suggestions: result.suggestions,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopicsAnalyzed: result.totalTopicsAnalyzed,
      totalGapsAnalyzed: result.totalGapsAnalyzed
    };
  }
} 