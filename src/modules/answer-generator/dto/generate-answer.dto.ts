import {
  IsString,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';

/**
 * Generate Answer DTO
 *
 * Data transfer object for generating an answer from a query.
 */
export class GenerateAnswerDto {
  @IsUUID()
  queryId: string;

  @IsString()
  query: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @IsOptional()
  @IsBoolean()
  validateAnswer?: boolean;
}
