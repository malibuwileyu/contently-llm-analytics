import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsArray, ValidateNested, IsISO8601, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for topic clustering options
 */
export class TopicClusteringOptionsDto {
  @ApiProperty({
    description: 'Start date for the clustering',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the clustering',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({
    description: 'Minimum frequency threshold for clusters',
    required: false,
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minFrequency?: number;

  @ApiProperty({
    description: 'Minimum similarity threshold for clustering (0-1)',
    required: false,
    example: 0.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  similarityThreshold?: number;

  @ApiProperty({
    description: 'Maximum number of clusters to return',
    required: false,
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

/**
 * DTO for a topic cluster
 */
export class TopicClusterDto {
  @ApiProperty({
    description: 'The central topic of the cluster',
    example: 'subscription'
  })
  @IsString()
  centralTopic: string;

  @ApiProperty({
    description: 'Related topics in this cluster',
    example: ['plan', 'pricing', 'billing']
  })
  @IsArray()
  @IsString({ each: true })
  relatedTopics: string[];

  @ApiProperty({
    description: 'The frequency of this topic cluster',
    example: 25
  })
  @IsNumber()
  frequency: number;

  @ApiProperty({
    description: 'The relevance score of this cluster (0-1)',
    example: 0.75
  })
  @IsNumber()
  relevance: number;

  @ApiProperty({
    description: 'Example messages related to this cluster',
    example: [
      'How do I change my subscription plan?',
      'What are the pricing options for the premium plan?',
      'Can I get a discount on my annual subscription?'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  examples: string[];
}

/**
 * DTO for topic clustering period
 */
export class TopicClusteringPeriodDto {
  @ApiProperty({
    description: 'Start date of the clustering period',
    example: '2023-01-01T00:00:00Z'
  })
  @IsISO8601()
  startDate: string;

  @ApiProperty({
    description: 'End date of the clustering period',
    example: '2023-01-31T23:59:59Z'
  })
  @IsISO8601()
  endDate: string;
}

/**
 * DTO for topic clustering results
 */
export class TopicClusteringResultsDto {
  @ApiProperty({
    description: 'The clusters of topics',
    type: [TopicClusterDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicClusterDto)
  clusters: TopicClusterDto[];

  @ApiProperty({
    description: 'The time period of the analysis',
    type: TopicClusteringPeriodDto
  })
  @ValidateNested()
  @Type(() => TopicClusteringPeriodDto)
  period: TopicClusteringPeriodDto;

  @ApiProperty({
    description: 'Total number of topics analyzed',
    example: 50
  })
  @IsNumber()
  totalTopics: number;

  @ApiProperty({
    description: 'Total number of conversations analyzed',
    example: 100
  })
  @IsNumber()
  totalConversations: number;
}

/**
 * DTO for clustering topics for a brand
 */
export class ClusterTopicsDto {
  @ApiProperty({
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Options for the clustering',
    type: TopicClusteringOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TopicClusteringOptionsDto)
  options?: TopicClusteringOptionsDto;
} 