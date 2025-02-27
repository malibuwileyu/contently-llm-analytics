import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PubSub } from 'graphql-subscriptions';
import { JwtService } from '@nestjs/jwt';
import { AnswerResolver } from '../answer.resolver';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  BrandMention,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  BrandHealth,
  BrandMentionAddedPayload,
  BrandHealthInput,
} from '../answer.types';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { SentimentTrend } from '../../interfaces/sentiment-analysis.interface';

interface AsyncIteratorWithSymbol<T> extends AsyncIterator<T> {
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

class MockPubSub {
  private handlers: Map<string, ((payload: any) => void)[]> = new Map();

  async publish(triggerName: string, payload: any): Promise<void> {
    const handlers = this.handlers.get(triggerName) || [];
    handlers.forEach(handler => handler(payload));
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIteratorWithSymbol<T> {
    const triggerName = Array.isArray(triggers) ? triggers[0] : triggers;

    const iterator: AsyncIteratorWithSymbol<T> = {
      next: () => {
        return new Promise(resolve => {
          if (!this.handlers.has(triggerName)) {
            this.handlers.set(triggerName, []);
          }

          const handlers = this.handlers.get(triggerName)!;
          handlers.push((payload: T) => {
            resolve({ value: payload, done: false });
          });
        });
      },
      return: () => Promise.resolve({ value: undefined, done: true }),
      throw: () => Promise.resolve({ value: undefined, done: true }),
      [Symbol.asyncIterator]() {
        return this;
      },
    };

    return iterator;
  }
}

describe('AnswerResolver', () => {
  let resolver: AnswerResolver;
  let pubSub: MockPubSub;
  let jwtService: JwtService;
  let answerEngineService: Partial<AnswerEngineService>;

  beforeEach(async () => {
    pubSub = new MockPubSub();
    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
    } as unknown as JwtService;

    answerEngineService = {
      getBrandHealth: jest.fn(),
      analyzeMention: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerResolver,
        {
          provide: 'PUB_SUB',
          useValue: pubSub,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: AnswerEngineService,
          useValue: answerEngineService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<AnswerResolver>(AnswerResolver);
  });

  describe('getRecentMentions', () => {
    it('should return recent brand mentions', async () => {
      // Mock the service response
      const mockTrend: SentimentTrend[] = [
        { date: new Date(), averageSentiment: 0.5 },
        { date: new Date(), averageSentiment: 0.7 },
      ];

      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue({
        overallSentiment: 0.6,
        trend: mockTrend,
        mentionCount: 2,
      });

      const result = await resolver.getRecentMentions('test-brand', 10);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('brandId', 'test-brand');
    });
  });

  describe('getBrandHealth', () => {
    it('should return brand health metrics', async () => {
      const input: BrandHealthInput = {
        brandId: 'test-brand',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Mock the service response
      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue({
        overallSentiment: 0.6,
        trend: [
          { date: new Date(), averageSentiment: 0.5 },
          { date: new Date(), averageSentiment: 0.7 },
        ],
        mentionCount: 2,
      });

      const result = await resolver.getBrandHealth(input);
      expect(result).toHaveProperty('overallSentiment');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('mentionCount');
    });
  });

  describe('analyzeContent', () => {
    it('should create and return a brand mention', async () => {
      const input = {
        brandId: 'test-brand',
        content: 'test content',
        context: {
          query: 'test query',
          response: 'test response',
          platform: 'test platform',
        },
      };

      // Mock the service response
      const mockMention = {
        id: 'test-id',
        brandId: input.brandId,
        content: input.content,
        sentiment: 0.5,
        context: input.context,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (answerEngineService.analyzeMention as jest.Mock).mockResolvedValue(
        mockMention,
      );

      const result = await resolver.analyzeContent(input);
      expect(result).toHaveProperty('id');
      expect(result.brandId).toBe(input.brandId);
      expect(result.content).toBe(input.content);
      expect(result.context).toBe(JSON.stringify(input.context));
    });

    it('should publish brand mention added event', async () => {
      const input = {
        brandId: 'test-brand',
        content: 'test content',
      };

      // Mock the service response
      const mockMention = {
        id: 'test-id',
        brandId: input.brandId,
        content: input.content,
        sentiment: 0.5,
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (answerEngineService.analyzeMention as jest.Mock).mockResolvedValue(
        mockMention,
      );

      const publishSpy = jest.spyOn(pubSub, 'publish');
      const result = await resolver.analyzeContent(input);

      expect(publishSpy).toHaveBeenCalledWith('brandMentionAdded', {
        brandMentionAdded: result,
      });
    });
  });

  describe('brandMentionAdded subscription', () => {
    it('should receive brand mention events for matching brandId', async () => {
      jest.setTimeout(10000); // Increase timeout for subscription test

      const brandId = 'test-brand';
      const iterator = resolver.brandMentionAdded(brandId);

      // Create a promise that will resolve when we receive the subscription event
      const subscriptionPromise = iterator.next();

      const mention: BrandMention = {
        id: 'test-id',
        brandId,
        content: 'test content',
        sentiment: 0.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const payload: BrandMentionAddedPayload = {
        brandMentionAdded: mention,
      };

      // Publish the event after a short delay to ensure subscription is set up
      setTimeout(() => {
        pubSub.publish('brandMentionAdded', payload);
      }, 100);

      // Wait for the subscription to receive the event
      const result = await subscriptionPromise;
      expect(result.value).toEqual(payload);
      expect(result.done).toBe(false);
    });
  });
});
