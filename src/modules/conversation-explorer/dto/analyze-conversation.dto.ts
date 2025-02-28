import { IsString, IsUUID, IsArray, ValidateNested, IsObject, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Message } from '../interfaces/conversation-analysis.interface';
import { Field, InputType } from '@nestjs/graphql';

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

@InputType()
export class AnalyzeConversationDto {
  @Field()
  conversationId: string;

  @Field({ nullable: true })
  brandId?: string;

  @Field(() => [MessageDto])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @Field(() => ConversationMetadataDto)
  @IsObject()
  @ValidateNested()
  @Type(() => ConversationMetadataDto)
  metadata: ConversationMetadataDto;

  @Field(() => [String], { nullable: true })
  topics?: string[];

  @Field(() => Boolean, { nullable: true })
  includeEntities?: boolean;

  @Field(() => Boolean, { nullable: true })
  includeSentiment?: boolean;
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