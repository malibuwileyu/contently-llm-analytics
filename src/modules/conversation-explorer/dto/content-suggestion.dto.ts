import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsArray, ValidateNested, IsISO8601, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for content suggestion options
 */
export class ContentSuggestionOptionsDto {
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
    description: 'Minimum gap score threshold',
    required: false,
    example: 0.3
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  minGapScore?: number;

  @ApiProperty({
    description: 'Content types to include',
    required: false,
    example: ['article', 'video', 'FAQ']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contentTypes?: string[];

  @ApiProperty({
    description: 'Maximum number of suggestions to return',
    required: false,
    example: 10
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

/**
 * DTO for a content suggestion
 */
export class ContentSuggestionDto {
  @ApiProperty({
    description: 'The title of the suggested content',
    example: 'Understanding Subscription Plans'
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'The type of content (e.g., article, video, FAQ)',
    example: 'article'
  })
  @IsString()
  type: string;

  @ApiProperty({
    description: 'The priority of the suggestion (higher means more important)',
    example: 8.5
  })
  @IsNumber()
  priority: number;

  @ApiProperty({
    description: 'The topics covered by the suggestion',
    example: ['subscription', 'plan', 'pricing']
  })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({
    description: 'The gap score that led to this suggestion (higher means bigger gap)',
    example: 0.75
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  gapScore: number;

  @ApiProperty({
    description: 'Estimated impact of creating this content (1-10)',
    example: 8
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  estimatedImpact: number;

  @ApiProperty({
    description: 'Example questions this content would answer',
    example: [
      'How do I change my subscription plan?',
      'What are the pricing options for premium plans?',
      'Can I get a discount on annual subscriptions?'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  exampleQuestions: string[];

  @ApiProperty({
    description: 'Suggested outline or key points to cover',
    example: [
      'Introduction to subscription plans',
      'Comparing different plan tiers',
      'How to upgrade or downgrade',
      'Billing cycles and payment options',
      'Conclusion and next steps'
    ]
  })
  @IsArray()
  @IsString({ each: true })
  suggestedOutline: string[];
}

/**
 * DTO for content suggestion period
 */
export class ContentSuggestionPeriodDto {
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
 * DTO for content suggestion results
 */
export class ContentSuggestionResultsDto {
  @ApiProperty({
    description: 'The suggested content items',
    type: [ContentSuggestionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentSuggestionDto)
  suggestions: ContentSuggestionDto[];

  @ApiProperty({
    description: 'The time period of the analysis',
    type: ContentSuggestionPeriodDto
  })
  @ValidateNested()
  @Type(() => ContentSuggestionPeriodDto)
  period: ContentSuggestionPeriodDto;

  @ApiProperty({
    description: 'Total number of topics analyzed',
    example: 50
  })
  @IsNumber()
  totalTopicsAnalyzed: number;

  @ApiProperty({
    description: 'Total number of gaps analyzed',
    example: 15
  })
  @IsNumber()
  totalGapsAnalyzed: number;
}

/**
 * DTO for suggesting content for a brand
 */
export class SuggestContentDto {
  @ApiProperty({
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Options for the suggestion',
    type: ContentSuggestionOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentSuggestionOptionsDto)
  options?: ContentSuggestionOptionsDto;
} 