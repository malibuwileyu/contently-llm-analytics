import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsArray, ValidateNested, IsISO8601, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for topic gap analysis options
 */
export class TopicGapAnalysisOptionsDto {
  @ApiProperty({
    description: 'Start date for the analysis',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the analysis',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({
    description: 'Minimum frequency threshold for topics',
    required: false,
    example: 3
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minFrequency?: number;

  @ApiProperty({
    description: 'Minimum gap score threshold',
    required: false,
    example: 0.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minGapScore?: number;

  @ApiProperty({
    description: 'Maximum number of gaps to return',
    required: false,
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

/**
 * DTO for a topic gap
 */
export class TopicGapDto {
  @ApiProperty({
    description: 'The topic with a gap in content',
    example: 'pricing'
  })
  @IsString()
  topic: string;

  @ApiProperty({
    description: 'The gap score (higher means bigger gap)',
    example: 0.75
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  gapScore: number;

  @ApiProperty({
    description: 'Related topics',
    example: ['subscription', 'plan', 'discount']
  })
  @IsArray()
  @IsString({ each: true })
  relatedTopics: string[];

  @ApiProperty({
    description: 'Frequency of the topic in conversations',
    example: 25
  })
  @IsNumber()
  @Min(0)
  frequency: number;

  @ApiProperty({
    description: 'Example questions that highlight the gap',
    example: [
      'How much does the premium plan cost?',
      'Are there any discounts available for annual subscriptions?',
      'Can I get a student discount?'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  exampleQuestions: string[];

  @ApiProperty({
    description: 'Suggested content areas to cover',
    example: [
      'pricing overview',
      'pricing guide',
      'pricing and subscription',
      'pricing and discount',
      'how to pricing'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  suggestedContentAreas: string[];
}

/**
 * DTO for topic gap analysis period
 */
export class TopicGapAnalysisPeriodDto {
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
 * DTO for topic gap analysis results
 */
export class TopicGapAnalysisResultsDto {
  @ApiProperty({
    description: 'The identified topic gaps',
    type: [TopicGapDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicGapDto)
  gaps: TopicGapDto[];

  @ApiProperty({
    description: 'The time period of the analysis',
    type: TopicGapAnalysisPeriodDto
  })
  @ValidateNested()
  @Type(() => TopicGapAnalysisPeriodDto)
  period: TopicGapAnalysisPeriodDto;

  @ApiProperty({
    description: 'Total number of topics analyzed',
    example: 50
  })
  @IsNumber()
  totalTopicsAnalyzed: number;

  @ApiProperty({
    description: 'Total number of conversations analyzed',
    example: 100
  })
  @IsNumber()
  totalConversationsAnalyzed: number;
}

/**
 * DTO for analyzing topic gaps for a brand
 */
export class AnalyzeTopicGapsDto {
  @ApiProperty({
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Options for the analysis',
    type: TopicGapAnalysisOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TopicGapAnalysisOptionsDto)
  options?: TopicGapAnalysisOptionsDto;
} 