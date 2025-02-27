import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsArray, ValidateNested, IsISO8601, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for volume estimation options
 */
export class VolumeEstimationOptionsDto {
  @ApiProperty({
    description: 'Start date for the estimation',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiProperty({
    description: 'End date for the estimation',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @ApiProperty({
    description: 'Whether to include daily breakdown',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeDaily?: boolean;

  @ApiProperty({
    description: 'Whether to include weekly breakdown',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeWeekly?: boolean;

  @ApiProperty({
    description: 'Whether to include monthly breakdown',
    required: false,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  includeMonthly?: boolean;
}

/**
 * DTO for volume metrics
 */
export class VolumeMetricsDto {
  @ApiProperty({
    description: 'Total number of conversations',
    example: 1250
  })
  @IsNumber()
  totalConversations: number;

  @ApiProperty({
    description: 'Total number of messages',
    example: 7500
  })
  @IsNumber()
  totalMessages: number;

  @ApiProperty({
    description: 'Average messages per conversation',
    example: 6
  })
  @IsNumber()
  avgMessagesPerConversation: number;

  @ApiProperty({
    description: 'Average user messages per conversation',
    example: 3
  })
  @IsNumber()
  avgUserMessagesPerConversation: number;

  @ApiProperty({
    description: 'Average assistant messages per conversation',
    example: 3
  })
  @IsNumber()
  avgAssistantMessagesPerConversation: number;

  @ApiProperty({
    description: 'Average conversation duration in seconds',
    example: 180
  })
  @IsNumber()
  avgConversationDuration: number;
}

/**
 * DTO for volume by time period
 */
export class VolumeByTimePeriodDto {
  @ApiProperty({
    description: 'The time period (e.g., "2023-01-01" for daily, "2023-01" for monthly)',
    example: '2023-01-15'
  })
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Number of conversations in this period',
    example: 42
  })
  @IsNumber()
  conversationCount: number;

  @ApiProperty({
    description: 'Number of messages in this period',
    example: 252
  })
  @IsNumber()
  messageCount: number;

  @ApiProperty({
    description: 'Number of user messages in this period',
    example: 126
  })
  @IsNumber()
  userMessageCount: number;

  @ApiProperty({
    description: 'Number of assistant messages in this period',
    example: 126
  })
  @IsNumber()
  assistantMessageCount: number;
}

/**
 * DTO for volume estimation period
 */
export class VolumeEstimationPeriodDto {
  @ApiProperty({
    description: 'Start date of the estimation period',
    example: '2023-01-01T00:00:00Z'
  })
  @IsISO8601()
  startDate: string;

  @ApiProperty({
    description: 'End date of the estimation period',
    example: '2023-01-31T23:59:59Z'
  })
  @IsISO8601()
  endDate: string;
}

/**
 * DTO for volume estimation results
 */
export class VolumeEstimationResultsDto {
  @ApiProperty({
    description: 'Overall volume metrics',
    type: VolumeMetricsDto
  })
  @ValidateNested()
  @Type(() => VolumeMetricsDto)
  metrics: VolumeMetricsDto;

  @ApiProperty({
    description: 'Volume by day',
    type: [VolumeByTimePeriodDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeByTimePeriodDto)
  byDay: VolumeByTimePeriodDto[];

  @ApiProperty({
    description: 'Volume by week',
    type: [VolumeByTimePeriodDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeByTimePeriodDto)
  byWeek: VolumeByTimePeriodDto[];

  @ApiProperty({
    description: 'Volume by month',
    type: [VolumeByTimePeriodDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeByTimePeriodDto)
  byMonth: VolumeByTimePeriodDto[];

  @ApiProperty({
    description: 'The time period of the analysis',
    type: VolumeEstimationPeriodDto
  })
  @ValidateNested()
  @Type(() => VolumeEstimationPeriodDto)
  period: VolumeEstimationPeriodDto;
}

/**
 * DTO for estimating volume for a brand
 */
export class EstimateVolumeDto {
  @ApiProperty({
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  brandId: string;

  @ApiProperty({
    description: 'Options for the estimation',
    type: VolumeEstimationOptionsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => VolumeEstimationOptionsDto)
  options?: VolumeEstimationOptionsDto;
} 