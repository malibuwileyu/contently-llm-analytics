import { Field, ObjectType } from '@nestjs/graphql';
import { BaseEntity } from '../../../shared/base.entity';

@ObjectType()
export class Conversation extends BaseEntity {
  @Field()
  brandId: string;

  @Field(() => [Message])
  messages: Message[];

  @Field(() => Object)
  metadata: Record<string, any>;
}

@ObjectType()
export class Message {
  @Field()
  role: string;

  @Field()
  content: string;

  @Field()
  timestamp: Date;
} 