import { ObjectType, Field } from '@nestjs/graphql';

/**
 * GraphQL type for a message in a conversation
 */
@ObjectType('Message')
export class MessageType {
  @Field()
  role: string;

  @Field()
  content: string;

  @Field()
  timestamp: Date;
} 