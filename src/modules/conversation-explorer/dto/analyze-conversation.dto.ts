import { IsString, IsUUID, IsArray, ValidateNested, IsObject, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Message } from '../interfaces/conversation-analysis.interface';

/**
 * DTO for a message in a conversation
 */
export class MessageDto implements Message {
  /**
   * The role of the message sender
   */
  @IsEnum(['user', 'assistant'])
  role: 'user' | 'assistant';
  
  /**
   * The content of the message
   */
  @IsString()
  content: string;
  
  /**
   * When the message was sent
   */
  @Type(() => Date)
  timestamp: Date;
}

/**
 * DTO for conversation metadata
 */
export class ConversationMetadataDto {
  /**
   * The platform where the conversation took place
   */
  @IsString()
  platform: string;
  
  /**
   * The context of the conversation
   */
  @IsString()
  context: string;
  
  /**
   * Tags associated with the conversation
   */
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}

/**
 * DTO for analyzing a conversation
 */
export class AnalyzeConversationDto {
  /**
   * The ID of the brand associated with this conversation
   */
  @IsUUID()
  brandId: string;
  
  /**
   * The messages in the conversation
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
  
  /**
   * Metadata about the conversation
   */
  @IsObject()
  @ValidateNested()
  @Type(() => ConversationMetadataDto)
  metadata: ConversationMetadataDto;
}

/**
 * DTO for trend options
 */
export class TrendOptionsDto {
  /**
   * Start date for the trend
   */
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;
  
  /**
   * End date for the trend
   */
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;
} 