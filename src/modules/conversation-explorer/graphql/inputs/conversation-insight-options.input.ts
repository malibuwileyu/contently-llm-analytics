import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsDate, IsArray } from 'class-validator';

/**
 * Input type for conversation insight options
 */
@InputType()
export class ConversationInsightOptionsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  type?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  limit?: number;
} 