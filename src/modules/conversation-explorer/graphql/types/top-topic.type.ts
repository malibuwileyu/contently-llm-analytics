import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL type for a top topic in conversation trends
 */
@ObjectType('TopTopic')
export class TopTopicType {
  @Field()
  name: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  averageRelevance: number;
} 