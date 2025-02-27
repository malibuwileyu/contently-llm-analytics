import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL type for a top intent in conversation trends
 */
@ObjectType('TopIntent')
export class TopIntentType {
  @Field()
  category: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  averageConfidence: number;
} 