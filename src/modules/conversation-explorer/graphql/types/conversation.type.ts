import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ConversationInsightType } from './conversation-insight.type';

/**
 * Type for a message in a conversation
 */
@ObjectType()
export class MessageType {
  @Field()
  role: string;

  @Field()
  content: string;

  @Field()
  timestamp: Date;
}

/**
 * Type for conversation metadata
 */
@ObjectType()
export class ConversationMetadataType {
  @Field({ nullable: true })
  platform?: string;

  @Field({ nullable: true })
  context?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];
}

/**
 * GraphQL object type for a conversation
 */
@ObjectType()
export class ConversationType {
  @Field(() => ID)
  _id: string;

  @Field()
  brandId: string;

  @Field(() => [MessageType])
  messages: MessageType[];

  @Field(() => ConversationMetadataType, { nullable: true })
  metadata?: ConversationMetadataType;

  @Field(() => [ConversationInsightType], { nullable: true })
  insights?: ConversationInsightType[];

  @Field()
  _engagementScore: number;

  @Field()
  analyzedAt: Date;
}
