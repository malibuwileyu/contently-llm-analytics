import { ObjectType, Field, ID, Float, InputType } from '@nestjs/graphql';

@ObjectType()
export class BrandMention {
  @Field(() => ID)
  id: string;

  @Field()
  brandId: string;

  @Field()
  content: string;

  @Field(() => Float)
  sentiment: number;

  @Field({ nullable: true })
  context?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TrendPoint {
  @Field()
  date: Date;

  @Field(() => Float)
  sentiment: number;
}

@ObjectType()
export class BrandHealth {
  @Field(() => Float)
  overallSentiment: number;

  @Field(() => [TrendPoint])
  trend: TrendPoint[];

  @Field()
  mentionCount: number;
}

@InputType()
export class AnalyzeContentInput {
  @Field()
  brandId: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  context?: string;
}

@InputType()
export class BrandHealthInput {
  @Field()
  brandId: string;

  @Field()
  startDate: Date;

  @Field()
  endDate: Date;
}

@ObjectType()
export class BrandMentionAddedPayload implements Record<string, unknown> {
  @Field(() => BrandMention)
  brandMentionAdded: BrandMention;

  [key: string]: unknown;
} 