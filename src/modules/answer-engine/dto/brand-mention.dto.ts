import { Expose, Type } from 'class-transformer';

/**
 * DTO for citation data in brand mentions
 */
export class CitationResponseDto {
  /**
   * ID of the citation
   */
  @Expose()
  id: string;

  /**
   * Source of the citation
   */
  @Expose()
  source: string;

  /**
   * Authority score of the citation
   */
  @Expose()
  authority: number;

  /**
   * Additional metadata about the citation
   */
  @Expose()
  metadata: Record<string, unknown>;
}

/**
 * DTO for context data in brand mentions
 */
export class ContextResponseDto {
  /**
   * Original query that led to the content
   */
  @Expose()
  query: string;

  /**
   * Full response containing the content
   */
  @Expose()
  response: string;

  /**
   * Platform where the content was generated
   */
  @Expose()
  platform: string;
}

/**
 * DTO for brand mention responses
 */
export class BrandMentionDto {
  /**
   * ID of the brand mention
   */
  @Expose()
  id: string;

  /**
   * ID of the brand
   */
  @Expose()
  brandId: string;

  /**
   * Content containing the brand mention
   */
  @Expose()
  content: string;

  /**
   * Sentiment score of the mention
   */
  @Expose()
  sentiment: number;

  /**
   * Context information about the mention
   */
  @Expose()
  @Type(() => ContextResponseDto)
  context: ContextResponseDto;

  /**
   * Citations associated with the mention
   */
  @Expose()
  @Type(() => CitationResponseDto)
  citations: CitationResponseDto[];

  /**
   * When the brand was mentioned
   */
  @Expose()
  mentionedAt: Date;
}

/**
 * DTO for brand health query
 */
export class BrandHealthInput {
  /**
   * ID of the brand to get health for
   */
  @Expose()
  brandId: string;

  /**
   * Start date for the health metrics
   */
  @Expose()
  @Type(() => Date)
  startDate: Date;

  /**
   * End date for the health metrics
   */
  @Expose()
  @Type(() => Date)
  endDate: Date;
} 