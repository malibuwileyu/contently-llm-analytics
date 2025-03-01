import {
  ObjectType,
  Field,
  ID,
  Float,
  InputType,
  GraphQLISODateTime,
  Scalar,
} from '@nestjs/graphql';
import { GraphQLScalarType, Kind } from 'graphql';

// Define a JSON scalar type for metadata fields
export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: unknown): unknown {
    return value; // Convert outgoing JSON value to proper format
  },
  parseValue(value: unknown): unknown {
    return value; // Convert incoming JSON value to proper format
  },
  parseLiteral(ast): unknown {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value);
      } catch {
        return ast.value;
      }
    }
    if (ast.kind === Kind.OBJECT) {
      const value = Object.create(null);
      ast.fields.forEach(field => {
        value[field.name.value] = this.parseLiteral(field.value);
      });
      return value;
    }
    return null;
  },
});

// Register the JSON scalar
@Scalar('JSON', () => JSONScalar)
export class JSONScalarType {}

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

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;
}

@ObjectType()
export class TrendPoint {
  @Field(() => GraphQLISODateTime)
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

  @Field(() => GraphQLISODateTime)
  startDate: Date;

  @Field(() => GraphQLISODateTime)
  endDate: Date;
}

@ObjectType()
export class BrandMentionAddedPayload implements Record<string, unknown> {
  @Field(() => BrandMention)
  brandMentionAdded: BrandMention;

  [key: string]: unknown;
}
