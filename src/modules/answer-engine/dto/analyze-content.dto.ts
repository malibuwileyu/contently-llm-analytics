import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { InputType, Field } from '@nestjs/graphql';
import { JSONScalar } from '../graphql/answer.types';

/**
 * DTO for citation data in content analysis
 */
@InputType()
export class CitationDto {
  /**
   * Source of the citation
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  source: string;

  /**
   * Additional metadata about the citation
   */
  @Field(() => JSONScalar, { nullable: true })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * DTO for context data in content analysis
 */
@InputType()
export class ContextDto {
  /**
   * Original query that led to the content
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  query: string;

  /**
   * Full response containing the content
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  response: string;

  /**
   * Platform where the content was generated
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  platform: string;
}

/**
 * DTO for analyzing content for brand mentions
 */
@InputType()
export class AnalyzeContentDto {
  /**
   * ID of the brand to analyze for
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  brandId: string;

  /**
   * Content to analyze for brand mentions
   */
  @Field()
  @IsString()
  @IsNotEmpty()
  content: string;

  /**
   * Context information about the content
   */
  @Field(() => ContextDto, { nullable: true })
  @IsObject()
  @ValidateNested()
  @Type(() => ContextDto)
  @IsOptional()
  context?: ContextDto;

  /**
   * Citations found in the content
   */
  @Field(() => [CitationDto], { nullable: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CitationDto)
  @IsOptional()
  citations?: CitationDto[];
} 