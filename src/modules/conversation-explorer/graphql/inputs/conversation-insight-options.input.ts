import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class ConversationInsightOptionsInput {
  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => Date, { nullable: true })
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  endDate?: Date;
}
