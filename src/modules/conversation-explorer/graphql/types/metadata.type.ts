import { ObjectType, Field } from '@nestjs/graphql';

/**
 * GraphQL type for conversation metadata
 */
@ObjectType('Metadata')
export class MetadataType {
  @Field()
  platform: string;

  @Field()
  context: string;

  @Field(() => [String])
  tags: string[];
} 