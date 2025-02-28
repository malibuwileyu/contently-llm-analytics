import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class ConversationAnalysis {
  @Field(() => [Intent])
  intents: Intent[];

  @Field(() => [Topic])
  topics: Topic[];

  @Field(() => Float)
  sentiment: number;

  @Field(() => [Entity])
  entities: Entity[];

  @Field(() => Float)
  engagementScore: number;
}

@ObjectType()
export class Intent {
  @Field()
  category: string;

  @Field(() => Float)
  confidence: number;
}

@ObjectType()
export class Topic {
  @Field()
  name: string;

  @Field(() => Float)
  relevance: number;
}

@ObjectType()
export class Entity {
  @Field()
  type: string;

  @Field()
  value: string;

  @Field(() => Float)
  confidence: number;
} 