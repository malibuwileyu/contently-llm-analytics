import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL input type for content suggestion options
 */
@InputType()
export class ContentSuggestionOptionsInput {
  @Field(() => String, { nullable: true, description: 'Start date for the analysis' })
  startDate?: string;

  @Field(() => String, { nullable: true, description: 'End date for the analysis' })
  endDate?: string;

  @Field(() => Float, { nullable: true, description: 'Minimum gap score threshold' })
  minGapScore?: number;

  @Field(() => [String], { nullable: true, description: 'Content types to include' })
  contentTypes?: string[];

  @Field(() => Int, { nullable: true, description: 'Maximum number of suggestions to return' })
  limit?: number;
}

/**
 * GraphQL object type for a content suggestion
 */
@ObjectType()
export class ContentSuggestionType {
  @Field(() => String, { description: 'The title of the suggested content' })
  title: string;

  @Field(() => String, { description: 'The type of content (e.g., article, video, FAQ)' })
  type: string;

  @Field(() => Float, { description: 'The priority of the suggestion (higher means more important)' })
  priority: number;

  @Field(() => [String], { description: 'The topics covered by the suggestion' })
  topics: string[];

  @Field(() => Float, { description: 'The gap score that led to this suggestion (higher means bigger gap)' })
  gapScore: number;

  @Field(() => Int, { description: 'Estimated impact of creating this content (1-10)' })
  estimatedImpact: number;

  @Field(() => [String], { description: 'Example questions this content would answer' })
  exampleQuestions: string[];

  @Field(() => [String], { description: 'Suggested outline or key points to cover' })
  suggestedOutline: string[];
}

/**
 * GraphQL object type for content suggestion period
 */
@ObjectType()
export class ContentSuggestionPeriodType {
  @Field(() => String, { description: 'Start date of the analysis period' })
  startDate: string;

  @Field(() => String, { description: 'End date of the analysis period' })
  endDate: string;
}

/**
 * GraphQL object type for content suggestion results
 */
@ObjectType()
export class ContentSuggestionResultsType {
  @Field(() => [ContentSuggestionType], { description: 'The suggested content items' })
  suggestions: ContentSuggestionType[];

  @Field(() => ContentSuggestionPeriodType, { description: 'The time period of the analysis' })
  period: ContentSuggestionPeriodType;

  @Field(() => Int, { description: 'Total number of topics analyzed' })
  totalTopicsAnalyzed: number;

  @Field(() => Int, { description: 'Total number of gaps analyzed' })
  totalGapsAnalyzed: number;
} 