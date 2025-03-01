import { Field, ObjectType, Float } from '@nestjs/graphql';

@ObjectType()
export class ConversationAnalysis {
  @Field(() => [Intent])
  _intents: Intent[];

  @Field(() => [Topic])
  _topics: Topic[];

  @Field(() => Float)
  _sentiment: number;

  @Field(() => [Entity])
  entities: Entity[];

  @Field(() => Float)
  _engagementScore: number;
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
  _value: string;

  @Field(() => Float)
  confidence: number;
}
