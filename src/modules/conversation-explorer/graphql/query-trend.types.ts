import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL input type for query trend options
 */
@InputType()
export class QueryTrendOptionsInput {
  @Field(() => String, { nullable: true, description: 'Start date for the trend analysis' })
  startDate?: string;

  @Field(() => String, { nullable: true, description: 'End date for the trend analysis' })
  endDate?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum frequency threshold for trends' })
  minFrequency?: number;

  @Field(() => Float, { nullable: true, description: 'Minimum growth rate threshold for rising trends (percentage)' })
  minGrowthRate?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum number of trends to return' })
  limit?: number;
}

/**
 * GraphQL object type for a query trend
 */
@ObjectType()
export class QueryTrendType {
  @Field(() => String, { description: 'The query pattern detected' })
  pattern: string;

  @Field(() => Int, { description: 'The frequency of this query pattern' })
  frequency: number;

  @Field(() => Float, { description: 'The growth rate of this query pattern (percentage)' })
  growthRate: number;

  @Field(() => String, { description: 'The first time this query pattern was detected' })
  firstSeen: string;

  @Field(() => String, { description: 'The last time this query pattern was detected' })
  lastSeen: string;

  @Field(() => [String], { description: 'Related topics to this query pattern' })
  relatedTopics: string[];
}

/**
 * GraphQL object type for query trend analysis period
 */
@ObjectType()
export class QueryTrendPeriodType {
  @Field(() => String, { description: 'Start date of the analysis period' })
  startDate: string;

  @Field(() => String, { description: 'End date of the analysis period' })
  endDate: string;
}

/**
 * GraphQL object type for query trend analysis results
 */
@ObjectType()
export class QueryTrendAnalysisType {
  @Field(() => [QueryTrendType], { description: 'Rising query trends (growing in popularity)' })
  risingTrends: QueryTrendType[];

  @Field(() => [QueryTrendType], { description: 'Falling query trends (declining in popularity)' })
  fallingTrends: QueryTrendType[];

  @Field(() => [QueryTrendType], { description: 'Stable query trends (consistent popularity)' })
  stableTrends: QueryTrendType[];

  @Field(() => QueryTrendPeriodType, { description: 'The time period of the analysis' })
  period: QueryTrendPeriodType;
} 