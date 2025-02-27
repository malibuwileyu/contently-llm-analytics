import { Controller, Get, Post, Body, Query, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QueryTrendAnalysisService } from '../services/query-trend-analysis.service';
import { 
  QueryTrendOptionsDto, 
  QueryTrendAnalysisDto, 
  AnalyzeQueryTrendsDto 
} from '../dto/query-trend.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * Controller for query trend analysis
 */
@ApiTags('query-trends')
@Controller('api/query-trends')
@UseGuards(AuthGuard('jwt'))
export class QueryTrendController {
  private readonly logger = new Logger(QueryTrendController.name);

  constructor(
    private readonly queryTrendService: QueryTrendAnalysisService
  ) {}

  /**
   * Analyze query trends for a specific brand
   */
  @Post('analyze')
  @ApiOperation({ summary: 'Analyze query trends for a brand' })
  @ApiResponse({
    status: 200,
    description: 'Query trend analysis results',
    type: QueryTrendAnalysisDto
  })
  async analyzeQueryTrends(
    @Body() analyzeDto: AnalyzeQueryTrendsDto
  ): Promise<QueryTrendAnalysisDto> {
    this.logger.debug(`Analyzing query trends for brand: ${analyzeDto.brandId}`);
    
    const result = await this.queryTrendService.analyzeQueryTrends(
      analyzeDto.brandId,
      analyzeDto.options ? {
        startDate: analyzeDto.options.startDate ? new Date(analyzeDto.options.startDate) : undefined,
        endDate: analyzeDto.options.endDate ? new Date(analyzeDto.options.endDate) : undefined,
        minFrequency: analyzeDto.options.minFrequency,
        minGrowthRate: analyzeDto.options.minGrowthRate,
        limit: analyzeDto.options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      risingTrends: result.risingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      fallingTrends: result.fallingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      stableTrends: result.stableTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      }
    };
  }

  /**
   * Get query trends for a specific brand
   */
  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get query trends for a brand' })
  @ApiParam({
    name: 'brandId',
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for the trend analysis',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for the trend analysis',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @ApiQuery({
    name: 'minFrequency',
    description: 'Minimum frequency threshold for trends',
    required: false,
    example: 3
  })
  @ApiQuery({
    name: 'minGrowthRate',
    description: 'Minimum growth rate threshold for rising trends (percentage)',
    required: false,
    example: 10
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of trends to return',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Query trend analysis results',
    type: QueryTrendAnalysisDto
  })
  async getQueryTrends(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minFrequency') minFrequency?: number,
    @Query('minGrowthRate') minGrowthRate?: number,
    @Query('limit') limit?: number
  ): Promise<QueryTrendAnalysisDto> {
    this.logger.debug(`Getting query trends for brand: ${brandId}`);
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minFrequency: minFrequency ? Number(minFrequency) : undefined,
      minGrowthRate: minGrowthRate ? Number(minGrowthRate) : undefined,
      limit: limit ? Number(limit) : undefined
    };
    
    const result = await this.queryTrendService.analyzeQueryTrends(brandId, options);
    
    // Convert Date objects to ISO strings for the response
    return {
      risingTrends: result.risingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      fallingTrends: result.fallingTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      stableTrends: result.stableTrends.map(trend => ({
        ...trend,
        firstSeen: trend.firstSeen.toISOString(),
        lastSeen: trend.lastSeen.toISOString()
      })),
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      }
    };
  }
} 