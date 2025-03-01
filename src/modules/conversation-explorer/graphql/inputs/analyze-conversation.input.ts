import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsArray,
  IsObject,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Input type for a message in a conversation
 */
@InputType()
export class MessageInput {
  @Field()
  @IsString()
  role: string;

  @Field()
  @IsString()
  content: string;

  @Field()
  timestamp: Date;
}

/**
 * Input type for conversation metadata
 */
@InputType()
export class ConversationMetadataInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  platform?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  context?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

/**
 * Input type for analyzing a conversation
 */
@InputType()
export class AnalyzeConversationInput {
  @Field()
  @IsString()
  brandId: string;

  @Field(() => [MessageInput])
  @IsArray()
  @ValidateNested({ _each: true })
  @Type(() => MessageInput)
  messages: MessageInput[];

  @Field(() => ConversationMetadataInput, { nullable: true })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => ConversationMetadataInput)
  metadata?: ConversationMetadataInput;
}
