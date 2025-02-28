import { ObjectType, Field, ID } from '@nestjs/graphql';

/**
 * GraphQL object type for a conversation insight
 */
@ObjectType()
export class ConversationInsightType {
  @Field(() => ID)
  id: string;

  @Field()
  type: string;

  @Field()
  category: string;

  @Field()
  confidence: number;

  @Field()
  details: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
} 