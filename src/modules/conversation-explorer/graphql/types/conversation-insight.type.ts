import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

/**
 * GraphQL type for a conversation insight
 */
@ObjectType('ConversationInsight')
export class ConversationInsightType {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  conversationId: string;

  @Field()
  type: string;

  @Field()
  category: string;

  @Field(() => Float)
  confidence: number;

  @Field(() => Object, { nullable: true })
  details?: Record<string, any>;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 