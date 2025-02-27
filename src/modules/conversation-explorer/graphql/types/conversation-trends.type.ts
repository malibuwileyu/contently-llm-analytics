import { ObjectType, Field } from '@nestjs/graphql';
import { TopIntentType } from './top-intent.type';
import { TopTopicType } from './top-topic.type';
import { EngagementTrendType } from './engagement-trend.type';
import { CommonActionType } from './common-action.type';

/**
 * GraphQL type for conversation trends
 */
@ObjectType('ConversationTrends')
export class ConversationTrendsType {
  @Field(() => [TopIntentType])
  topIntents: TopIntentType[];

  @Field(() => [TopTopicType])
  topTopics: TopTopicType[];

  @Field(() => [EngagementTrendType])
  engagementTrends: EngagementTrendType[];

  @Field(() => [CommonActionType])
  commonActions: CommonActionType[];
} 