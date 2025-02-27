import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL input type for topic clustering options
 */
@InputType()
export class TopicClusteringOptionsInput {
  @Field(() => String, { nullable: true, description: 'Start date for the clustering' })
  startDate?: string;

  @Field(() => String, { nullable: true, description: 'End date for the clustering' })
  endDate?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum frequency threshold for clusters' })
  minFrequency?: number;

  @Field(() => Float, { nullable: true, description: 'Minimum similarity threshold for clustering (0-1)' })
  similarityThreshold?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum number of clusters to return' })
  limit?: number;
}

/**
 * GraphQL object type for a topic cluster
 */
@ObjectType()
export class TopicClusterType {
  @Field(() => String, { description: 'The central topic of the cluster' })
  centralTopic: string;

  @Field(() => [String], { description: 'Related topics in this cluster' })
  relatedTopics: string[];

  @Field(() => Int, { description: 'The frequency of this topic cluster' })
  frequency: number;

  @Field(() => Float, { description: 'The relevance score of this cluster (0-1)' })
  relevance: number;

  @Field(() => [String], { description: 'Example messages related to this cluster' })
  examples: string[];
}

/**
 * GraphQL object type for topic clustering period
 */
@ObjectType()
export class TopicClusteringPeriodType {
  @Field(() => String, { description: 'Start date of the clustering period' })
  startDate: string;

  @Field(() => String, { description: 'End date of the clustering period' })
  endDate: string;
}

/**
 * GraphQL object type for topic clustering results
 */
@ObjectType()
export class TopicClusteringResultsType {
  @Field(() => [TopicClusterType], { description: 'The clusters of topics' })
  clusters: TopicClusterType[];

  @Field(() => TopicClusteringPeriodType, { description: 'The time period of the analysis' })
  period: TopicClusteringPeriodType;

  @Field(() => Int, { description: 'Total number of topics analyzed' })
  totalTopics: number;

  @Field(() => Int, { description: 'Total number of conversations analyzed' })
  totalConversations: number;
} 