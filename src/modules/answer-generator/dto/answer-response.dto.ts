import { Exclude, Expose, Type } from 'class-transformer';

/**
 * Citation Response DTO
 *
 * Data transfer object for citation data in responses.
 */
export class CitationResponseDto {
  @Expose()
  source: string;

  @Expose()
  text?: string;

  @Expose()
  url?: string;

  @Expose()
  authority?: number;
}

/**
 * Answer Response DTO
 *
 * Data transfer object for returning generated answers.
 */
export class AnswerResponseDto {
  @Expose()
  id: string;

  @Expose()
  queryId: string;

  @Expose()
  content: string;

  @Expose()
  provider: string;

  @Expose()
  relevanceScore: number;

  @Expose()
  accuracyScore: number;

  @Expose()
  completenessScore: number;

  @Expose()
  overallScore: number;

  @Expose()
  status: 'pending' | 'validated' | 'rejected';

  @Expose()
  @Type(() => CitationResponseDto)
  citations?: CitationResponseDto[];

  @Expose()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;
}
