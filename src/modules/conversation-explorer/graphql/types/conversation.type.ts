import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { ConversationInsightType } from './conversation-insight.type';
import { MessageType } from './message.type';
import { MetadataType } from './metadata.type';

/**
 * GraphQL type for a conversation
 */
@ObjectType('Conversation')
export class ConversationType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  brandId: string;

  @Field(() => [MessageType])
  messages: MessageType[];

  @Field(() => MetadataType)
  metadata: MetadataType;

  @Field(() => [ConversationInsightType])
  insights: ConversationInsightType[];

  @Field(() => Float)
  engagementScore: number;

  @Field()
  analyzedAt: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 