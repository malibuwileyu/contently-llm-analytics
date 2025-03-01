import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Type for top intent
 */
@ObjectType()
export class TopIntent {
  @Field()
  category: string;

  @Field()
  count: number;

  @Field()
  averageConfidence: number;
}

/**
 * Type for top topic
 */
@ObjectType()
export class TopTopic {
  @Field()
  name: string;

  @Field()
  count: number;

  @Field()
  averageRelevance: number;
}

/**
 * Type for common action
 */
@ObjectType()
class CommonAction {
  @Field()
  type: string;

  @Field()
  count: number;

  @Field()
  averageConfidence: number;
}

/**
 * Type for engagement trend
 */
@ObjectType()
export class EngagementTrendPoint {
  @Field()
  date: Date;

  @Field()
  averageEngagement: number;
}

/**
 * GraphQL object type for conversation trends
 */
@ObjectType()
export class ConversationTrendsType {
  @Field(() => [TopIntent])
  topIntents: TopIntent[];

  @Field(() => [TopTopic])
  topTopics: TopTopic[];

  @Field(() => [CommonAction])
  commonActions: CommonAction[];

  @Field(() => [EngagementTrendPoint])
  engagementTrend: EngagementTrendPoint[];
}
