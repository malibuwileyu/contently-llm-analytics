import { Field, ObjectType, InputType, Float, Int } from '@nestjs/graphql';

/**
 * GraphQL input type for volume estimation options
 */
@InputType()
export class VolumeEstimationOptionsInput {
  @Field(() => String, { nullable: true, description: 'Start date for the estimation' })
  startDate?: string;

  @Field(() => String, { nullable: true, description: 'End date for the estimation' })
  endDate?: string;

  @Field(() => Boolean, { nullable: true, description: 'Whether to include daily breakdown' })
  includeDaily?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'Whether to include weekly breakdown' })
  includeWeekly?: boolean;

  @Field(() => Boolean, { nullable: true, description: 'Whether to include monthly breakdown' })
  includeMonthly?: boolean;
}

/**
 * GraphQL object type for volume metrics
 */
@ObjectType()
export class VolumeMetricsType {
  @Field(() => Int, { description: 'Total number of conversations' })
  totalConversations: number;

  @Field(() => Int, { description: 'Total number of messages' })
  totalMessages: number;

  @Field(() => Float, { description: 'Average messages per conversation' })
  avgMessagesPerConversation: number;

  @Field(() => Float, { description: 'Average user messages per conversation' })
  avgUserMessagesPerConversation: number;

  @Field(() => Float, { description: 'Average assistant messages per conversation' })
  avgAssistantMessagesPerConversation: number;

  @Field(() => Float, { description: 'Average conversation duration in seconds' })
  avgConversationDuration: number;
}

/**
 * GraphQL object type for volume by time period
 */
@ObjectType()
export class VolumeByTimePeriodType {
  @Field(() => String, { description: 'The time period (e.g., "2023-01-01" for daily, "2023-01" for monthly)' })
  period: string;

  @Field(() => Int, { description: 'Number of conversations in this period' })
  conversationCount: number;

  @Field(() => Int, { description: 'Number of messages in this period' })
  messageCount: number;

  @Field(() => Int, { description: 'Number of user messages in this period' })
  userMessageCount: number;

  @Field(() => Int, { description: 'Number of assistant messages in this period' })
  assistantMessageCount: number;
}

/**
 * GraphQL object type for volume estimation period
 */
@ObjectType()
export class VolumeEstimationPeriodType {
  @Field(() => String, { description: 'Start date of the estimation period' })
  startDate: string;

  @Field(() => String, { description: 'End date of the estimation period' })
  endDate: string;
}

/**
 * GraphQL object type for volume estimation results
 */
@ObjectType()
export class VolumeEstimationResultsType {
  @Field(() => VolumeMetricsType, { description: 'Overall volume metrics' })
  metrics: VolumeMetricsType;

  @Field(() => [VolumeByTimePeriodType], { description: 'Volume by day' })
  byDay: VolumeByTimePeriodType[];

  @Field(() => [VolumeByTimePeriodType], { description: 'Volume by week' })
  byWeek: VolumeByTimePeriodType[];

  @Field(() => [VolumeByTimePeriodType], { description: 'Volume by month' })
  byMonth: VolumeByTimePeriodType[];

  @Field(() => VolumeEstimationPeriodType, { description: 'The time period of the analysis' })
  period: VolumeEstimationPeriodType;
} 