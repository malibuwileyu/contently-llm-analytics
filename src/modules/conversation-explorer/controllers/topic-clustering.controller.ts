import { Controller, Get, Post, Body, Query, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TopicClusteringService } from '../services/topic-clustering.service';
import { 
  TopicClusteringOptionsDto, 
  TopicClusteringResultsDto, 
  ClusterTopicsDto 
} from '../dto/topic-cluster.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * Controller for topic clustering
 */
@ApiTags('topic-clusters')
@Controller('api/topic-clusters')
@UseGuards(AuthGuard('jwt'))
export class TopicClusteringController {
  private readonly logger = new Logger(TopicClusteringController.name);

  constructor(
    private readonly topicClusteringService: TopicClusteringService
  ) {}

  /**
   * Cluster topics for a specific brand
   */
  @Post('cluster')
  @ApiOperation({ summary: 'Cluster topics for a brand' })
  @ApiResponse({
    status: 200,
    description: 'Topic clustering results',
    type: TopicClusteringResultsDto
  })
  async clusterTopics(
    @Body() clusterDto: ClusterTopicsDto
  ): Promise<TopicClusteringResultsDto> {
    this.logger.debug(`Clustering topics for brand: ${clusterDto.brandId}`);
    
    const result = await this.topicClusteringService.clusterTopics(
      clusterDto.brandId,
      clusterDto.options ? {
        startDate: clusterDto.options.startDate ? new Date(clusterDto.options.startDate) : undefined,
        endDate: clusterDto.options.endDate ? new Date(clusterDto.options.endDate) : undefined,
        minFrequency: clusterDto.options.minFrequency,
        similarityThreshold: clusterDto.options.similarityThreshold,
        limit: clusterDto.options.limit
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      clusters: result.clusters,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopics: result.totalTopics,
      totalConversations: result.totalConversations
    };
  }

  /**
   * Get topic clusters for a specific brand
   */
  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get topic clusters for a brand' })
  @ApiParam({
    name: 'brandId',
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for the clustering',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for the clustering',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @ApiQuery({
    name: 'minFrequency',
    description: 'Minimum frequency threshold for clusters',
    required: false,
    example: 3
  })
  @ApiQuery({
    name: 'similarityThreshold',
    description: 'Minimum similarity threshold for clustering (0-1)',
    required: false,
    example: 0.5
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of clusters to return',
    required: false,
    example: 10
  })
  @ApiResponse({
    status: 200,
    description: 'Topic clustering results',
    type: TopicClusteringResultsDto
  })
  async getTopicClusters(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('minFrequency') minFrequency?: number,
    @Query('similarityThreshold') similarityThreshold?: number,
    @Query('limit') limit?: number
  ): Promise<TopicClusteringResultsDto> {
    this.logger.debug(`Getting topic clusters for brand: ${brandId}`);
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minFrequency: minFrequency ? Number(minFrequency) : undefined,
      similarityThreshold: similarityThreshold ? Number(similarityThreshold) : undefined,
      limit: limit ? Number(limit) : undefined
    };
    
    const result = await this.topicClusteringService.clusterTopics(brandId, options);
    
    // Convert Date objects to ISO strings for the response
    return {
      clusters: result.clusters,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      },
      totalTopics: result.totalTopics,
      totalConversations: result.totalConversations
    };
  }
} 