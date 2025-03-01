import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

/**
 * Enum for query intent types
 */
export enum QueryIntentType {
  INFORMATIONAL = 'informational',
  TRANSACTIONAL = 'transactional',
  NAVIGATIONAL = 'navigational',
  COMMERCIAL = 'commercial',
  LOCAL = 'local',
}

/**
 * Data transfer object for query categorization requests
 */
export class QueryCategorizationDto {
  @ApiProperty({
    description: 'The search query to categorize',
    example: 'What are the best running shoes for marathon training?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}

/**
 * Data transfer object for query tagging requests
 */
export class QueryTaggingDto {
  @ApiProperty({
    description: 'The search query to tag',
    example: 'Compare Nike Air Zoom vs Adidas Ultraboost for running',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiProperty({
    description: 'The business category ID for context',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

/**
 * Response object for query categorization
 */
export class QueryCategorizationResponseDto {
  @ApiProperty({
    description: 'Primary intent of the query',
    enum: QueryIntentType,
    example: QueryIntentType.INFORMATIONAL,
  })
  intent: QueryIntentType;

  @ApiProperty({
    description: 'Confidence score for the intent classification (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({
    description: 'Detected topics in the query',
    example: ['running', 'marathon', 'training', 'shoes'],
  })
  @IsArray()
  @IsString({ each: true })
  topics: string[];

  @ApiProperty({
    description: 'Detected entities in the query',
    example: ['Nike', 'Adidas', 'Air Zoom', 'Ultraboost'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  entities?: string[];
}

/**
 * Response object for query tagging
 */
export class QueryTaggingResponseDto {
  @ApiProperty({
    description: 'Tags assigned to the query',
    example: ['running', 'shoes', 'comparison', 'performance'],
  })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({
    description: 'Detected brand mentions',
    example: ['Nike', 'Adidas'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  brandMentions?: string[];

  @ApiProperty({
    description: 'Detected product categories',
    example: ['footwear', 'athletic shoes', 'running gear'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productCategories?: string[];

  @ApiProperty({
    description: 'Detected features mentioned',
    example: ['comfort', 'durability', 'price'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiProperty({
    description:
      'Sentiment analysis result (-1 to 1, where -1 is negative, 0 is neutral, 1 is positive)',
    example: 0.2,
    minimum: -1,
    maximum: 1,
    required: false,
  })
  @IsNumber()
  @Min(-1)
  @Max(1)
  @IsOptional()
  sentiment?: number;
}
