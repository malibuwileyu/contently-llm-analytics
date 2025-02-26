import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import {
  BrandMention,
  BrandHealth,
  AnalyzeContentInput,
  BrandHealthInput,
} from './answer.types';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

// Define event types
interface BrandMentionAddedPayload {
  brandMentionAdded: BrandMention;
}

@Resolver(() => BrandMention)
export class AnswerResolver {
  constructor(@Inject('PUB_SUB') private readonly pubSub: PubSub) {}

  // Mock data for testing
  private mockBrandMentions: BrandMention[] = [];
  private mockHealthData: Map<string, BrandHealth> = new Map();

  @Query(() => [BrandMention])
  @UseGuards(JwtAuthGuard)
  async brandMentions(): Promise<BrandMention[]> {
    // Return all brand mentions
    return this.mockBrandMentions;
  }

  @Query(() => BrandHealth)
  @UseGuards(JwtAuthGuard)
  async brandHealth(
    @Args('input') input: BrandHealthInput,
  ): Promise<BrandHealth> {
    // Mock implementation
    const health = this.mockHealthData.get(input.brandId) || {
      overallSentiment: Math.random(),
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        sentiment: Math.random(),
      })),
      mentionCount: Math.floor(Math.random() * 100),
    };

    return health;
  }

  @Mutation(() => BrandMention)
  @UseGuards(JwtAuthGuard)
  async analyzeContent(
    @Args('input') input: AnalyzeContentInput,
  ): Promise<BrandMention> {
    // Mock implementation
    const mention: BrandMention = {
      id: Math.random().toString(36).substring(7),
      brandId: input.brandId,
      content: input.content,
      sentiment: Math.random(),
      context: input.context || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.mockBrandMentions.push(mention);

    // Publish update for subscriptions
    await this.pubSub.publish('brandMentionAdded', {
      brandMentionAdded: mention,
    } as BrandMentionAddedPayload);

    return mention;
  }

  @Subscription(() => BrandMention, {
    filter: (
      payload: BrandMentionAddedPayload,
      variables: { _brandId: string },
    ) => payload.brandMentionAdded.brandId === variables._brandId,
    resolve: (payload: BrandMentionAddedPayload) => payload.brandMentionAdded,
  })
  brandMentionAdded(
    @Args('_brandId') _brandId: string,
  ): AsyncIterator<BrandMentionAddedPayload> {
    return this.pubSub.asyncIterator<BrandMentionAddedPayload>(
      'brandMentionAdded',
    );
  }
}
