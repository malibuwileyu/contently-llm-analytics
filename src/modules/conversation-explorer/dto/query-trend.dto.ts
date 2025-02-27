import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDate, IsNumber, IsString, IsArray, ValidateNested, IsISO8601 } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for query trend options
 */
export class QueryTrendOptionsDto {
  @ApiProperty({
    description: 'Start date for the trend analysis',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the trend analysis',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({
    description: 'Minimum frequency threshold for trends',
    required: false,
    example: 3
  })
  @IsOptional()
  @IsNumber()
  minFrequency?: number;

  @ApiProperty({
    description: 'Minimum growth rate threshold for rising trends (percentage)',
    required: false,
    example: 10
  })
  @IsOptional()
  @IsNumber()
  minGrowthRate?: number;

  @ApiProperty({
    description: 'Maximum number of trends to return',
    required: false,
    example: 10
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * DTO for a query trend
 */
export class QueryTrendDto {
  @ApiProperty({
    description: 'The query pattern detected',
    example: 'product pricing'
  })
  @IsString()
  pattern: string;

  @ApiProperty({
    description: 'The frequency of this query pattern',
    example: 15
  })
  @IsNumber()
  frequency: number;

  @ApiProperty({
    description: 'The growth rate of this query pattern (percentage)',
    example: 25.5
  })
  @IsNumber()
  growthRate: number;

  @ApiProperty({
    description: 'The first time this query pattern was detected',
    example: '2023-01-05T10:30:00Z'
  })
  @IsISO8601()
  firstSeen: string;

  @ApiProperty({
    description: 'The last time this query pattern was detected',
    example: '2023-01-28T14:15:00Z'
  })
  @IsISO8601()
  lastSeen: string;

  @ApiProperty({
    description: 'Related topics to this query pattern',
    example: ['pricing', 'subscription', 'discount', 'plans']
  })
  @IsArray()
  @IsString({ each: true })
  relatedTopics: string[];
}

/**
 * DTO for query trend analysis period
 */
export class QueryTrendPeriodDto {
  @ApiProperty({
    description: 'Start date of the analysis period',
    example: '2023-01-01T00:00:00Z'
  })
  @IsISO8601()
  startDate: string;

  @ApiProperty({
    description: 'End date of the analysis period',
    example: '2023-01-31T23:59:59Z'
  })
  @IsISO8601()
  endDate: string;
}

/**
 * DTO for query trend analysis results
 */
export class QueryTrendAnalysisDto {
  @ApiProperty({
    description: 'Rising query trends (growing in popularity)',
    type: [QueryTrendDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueryTrendDto)
  risingTrends: QueryTrendDto[];

  @ApiProperty({
    description: 'Falling query trends (declining in popularity)',
    type: [QueryTrendDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueryTrendDto)
  fallingTrends: QueryTrendDto[];

  @ApiProperty({
    description: 'Stable query trends (consistent popularity)',
    type: [QueryTrendDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QueryTrendDto)
  stableTrends: QueryTrendDto[];

  @ApiProperty({
    description: 'The time period of the analysis',
    type: QueryTrendPeriodDto
  })
  @ValidateNested()
  @Type(() => QueryTrendPeriodDto)
  period: QueryTrendPeriodDto;
}

/**
 * DTO for analyzing query trends for a brand
 */
export class AnalyzeQueryTrendsDto {
  @ApiProperty({
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Options for the trend analysis',
    type: QueryTrendOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QueryTrendOptionsDto)
  options?: QueryTrendOptionsDto;
} 