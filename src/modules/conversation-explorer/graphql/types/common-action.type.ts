import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL type for a common action in conversation trends
 */
@ObjectType('CommonAction')
export class CommonActionType {
  @Field()
  type: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  averageConfidence: number;
} 