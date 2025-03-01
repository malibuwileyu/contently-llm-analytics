import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import {
  BrandMention,
  BrandHealth,
  BrandHealthInput,
  BrandMentionAddedPayload,
} from './answer.types';
import { AuthGuard } from '../../../auth/guards/auth.guard';
import { AnswerEngineService } from '../services/answer-engine.service';
import { BrandMentionDto } from '../dto/brand-mention.dto';
import { AnalyzeContentDto } from '../dto/analyze-content.dto';

/**
 * GraphQL resolver for Answer Engine
 */
@Resolver(() => BrandMentionDto)
export class AnswerResolver {
  constructor(
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
    private readonly answerEngineService: AnswerEngineService,
  ) {}

  @Query(() => [BrandMention])
  @UseGuards(AuthGuard)
  async getRecentMentions(
    @Args('brandId') brandId: string,
    @Args('limit', { defaultValue: 10 }) limit: number,
  ): Promise<BrandMention[]> {
    // Get recent mentions from the service
    const mentions = await this.answerEngineService.getBrandHealth(brandId);

    // Map to the GraphQL type
    return mentions.trend.slice(0, limit).map(point => ({
      id: `mention-${point.date.getTime()}`,
      brandId,
      content: 'Content from ' + point.date.toISOString(),
      sentiment: point.averageSentiment,
      context: 'Generated from trend data',
      createdAt: point.date,
      updatedAt: point.date,
    }));
  }

  @Query(() => BrandHealth)
  @UseGuards(AuthGuard)
  async getBrandHealth(
    @Args('input') input: BrandHealthInput,
  ): Promise<BrandHealth> {
    const health = await this.answerEngineService.getBrandHealth(input.brandId);

    // Map to the GraphQL type
    return {
      overallSentiment: health.overallSentiment,
      trend: health.trend.map(point => ({
        date: point.date,
        sentiment: point.averageSentiment,
      })),
      mentionCount: health.mentionCount,
    };
  }

  @Mutation(() => BrandMention)
  @UseGuards(AuthGuard)
  async analyzeContent(
    @Args('data') data: AnalyzeContentDto,
  ): Promise<BrandMention> {
    const mention = await this.answerEngineService.analyzeMention(data);

    // Map to the GraphQL type and publish event
    const result = {
      id: mention.id,
      brandId: mention.brandId,
      content: mention.content,
      sentiment: mention.sentiment,
      context: JSON.stringify(mention.context),
      createdAt: mention.createdAt,
      updatedAt: mention.updatedAt,
    };

    // Publish the event for subscriptions
    await this.pubSub.publish('brandMentionAdded', {
      brandMentionAdded: result,
    });

    return result;
  }

  @Subscription(() => BrandMention, {
    filter: (
      payload: BrandMentionAddedPayload,
      variables: { brandId: string },
    ) => payload.brandMentionAdded.brandId === variables.brandId,
    resolve: (payload: BrandMentionAddedPayload) => payload.brandMentionAdded,
  })
  brandMentionAdded(
    @Args('brandId') brandId: string,
  ): AsyncIterator<BrandMentionAddedPayload> {
    return this.pubSub.asyncIterator<BrandMentionAddedPayload>(
      'brandMentionAdded',
    );
  }
}
