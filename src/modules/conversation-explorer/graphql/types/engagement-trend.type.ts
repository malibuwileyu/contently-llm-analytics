import { ObjectType, Field, Float } from '@nestjs/graphql';

/**
 * GraphQL type for an engagement trend data point
 */
@ObjectType('EngagementTrend')
export class EngagementTrendType {
  @Field()
  date: Date;

  @Field(() => Float)
  averageEngagement: number;
} 