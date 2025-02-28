import { InputType, Field } from '@nestjs/graphql';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Input type for trend options
 */
@InputType()
export class TrendOptionsInput {
  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @Field(() => [String], { nullable: true })
  topics?: string[];

  @Field(() => [String], { nullable: true })
  intents?: string[];
} 