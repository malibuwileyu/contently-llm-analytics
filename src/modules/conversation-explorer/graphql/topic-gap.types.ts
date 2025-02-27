import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL input type for topic gap analysis options
 */
@InputType()
export class TopicGapAnalysisOptionsInput {
  @Field(() => String, { nullable: true, description: 'Start date for the analysis' })
  startDate?: string;

  @Field(() => String, { nullable: true, description: 'End date for the analysis' })
  endDate?: string;

  @Field(() => Int, { nullable: true, description: 'Minimum frequency threshold for topics' })
  minFrequency?: number;

  @Field(() => Float, { nullable: true, description: 'Minimum gap score threshold' })
  minGapScore?: number;

  @Field(() => Int, { nullable: true, description: 'Maximum number of gaps to return' })
  limit?: number;
}

/**
 * GraphQL object type for a topic gap
 */
@ObjectType()
export class TopicGapType {
  @Field(() => String, { description: 'The topic with a gap in content' })
  topic: string;

  @Field(() => Float, { description: 'The gap score (higher means bigger gap)' })
  gapScore: number;

  @Field(() => [String], { description: 'Related topics' })
  relatedTopics: string[];

  @Field(() => Int, { description: 'Frequency of the topic in conversations' })
  frequency: number;

  @Field(() => [String], { description: 'Example questions that highlight the gap' })
  exampleQuestions: string[];

  @Field(() => [String], { description: 'Suggested content areas to cover' })
  suggestedContentAreas: string[];
}

/**
 * GraphQL object type for topic gap analysis period
 */
@ObjectType()
export class TopicGapAnalysisPeriodType {
  @Field(() => String, { description: 'Start date of the analysis period' })
  startDate: string;

  @Field(() => String, { description: 'End date of the analysis period' })
  endDate: string;
}

/**
 * GraphQL object type for topic gap analysis results
 */
@ObjectType()
export class TopicGapAnalysisResultsType {
  @Field(() => [TopicGapType], { description: 'The identified topic gaps' })
  gaps: TopicGapType[];

  @Field(() => TopicGapAnalysisPeriodType, { description: 'The time period of the analysis' })
  period: TopicGapAnalysisPeriodType;

  @Field(() => Int, { description: 'Total number of topics analyzed' })
  totalTopicsAnalyzed: number;

  @Field(() => Int, { description: 'Total number of conversations analyzed' })
  totalConversationsAnalyzed: number;
} 