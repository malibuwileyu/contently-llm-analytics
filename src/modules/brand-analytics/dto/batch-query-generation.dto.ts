import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryQueryRequest {
  @ApiProperty({ description: 'ID of the business category' })
  @IsUUID()
  @IsString()
  _categoryId: string;

  @ApiProperty({
    description: 'Maximum number of queries to generate',
    required: false,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class CustomerQueryRequest {
  @ApiProperty({ description: 'ID of the customer competitor' })
  @IsUUID()
  @IsString()
  _customerId: string;

  @ApiProperty({
    description: 'Maximum number of queries to generate',
    required: false,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class ComparisonQueryRequest {
  @ApiProperty({ description: 'ID of the first competitor' })
  @IsUUID()
  @IsString()
  _competitor1Id: string;

  @ApiProperty({ description: 'ID of the second competitor' })
  @IsUUID()
  @IsString()
  _competitor2Id: string;

  @ApiProperty({
    description: 'Maximum number of queries to generate',
    required: false,
    default: 10,
  })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class BatchQueryGenerationDto {
  @ApiProperty({
    description: 'List of category query requests',
    type: [CategoryQueryRequest],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryQueryRequest)
  @IsOptional()
  categories?: CategoryQueryRequest[];

  @ApiProperty({
    description: 'List of customer query requests',
    type: [CustomerQueryRequest],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerQueryRequest)
  @IsOptional()
  customers?: CustomerQueryRequest[];

  @ApiProperty({
    description: 'List of comparison query requests',
    type: [ComparisonQueryRequest],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComparisonQueryRequest)
  @IsOptional()
  comparisons?: ComparisonQueryRequest[];
}

export class BatchQueryGenerationResponseItem {
  @ApiProperty({
    description: 'Type of query generation (category, customer, or comparison)',
  })
  type: 'category' | 'customer' | 'comparison';

  @ApiProperty({ description: 'ID(s) used for query generation' })
  _ids: string[];

  @ApiProperty({ description: 'Generated queries' })
  queries: string[];

  @ApiProperty({
    description: 'Error message if query generation failed',
    required: false,
  })
  error?: string;
}

export class BatchQueryGenerationResponse {
  @ApiProperty({
    description: 'List of query generation results',
    type: [BatchQueryGenerationResponseItem],
  })
  results: BatchQueryGenerationResponseItem[];
}
