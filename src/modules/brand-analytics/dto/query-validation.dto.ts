import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Data transfer object for query validation requests
 */
export class QueryValidationDto {
  @ApiProperty({
    description: 'The search query to validate',
    example: 'What are the best running shoes for marathon training?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Query must be at least 5 characters long' })
  @MaxLength(200, { message: 'Query must not exceed 200 characters' })
  query: string;
}

/**
 * Response object for query validation
 */
export class QueryValidationResponseDto {
  @ApiProperty({
    description: 'Whether the query is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation score between 0 and 1',
    example: 0.85,
  })
  score: number;

  @ApiProperty({
    description: 'Detected issues with the query, if any',
    example: ['Query is too generic', 'Missing specific product category'],
    required: false,
  })
  issues?: string[];

  @ApiProperty({
    description: 'Suggested improvements for the query',
    example: ['Add specific brand names', 'Specify use case or requirements'],
    required: false,
  })
  suggestions?: string[];
}
