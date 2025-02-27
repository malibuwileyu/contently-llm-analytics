import { Test, TestingModule } from '@nestjs/testing';
import { PubSub } from 'graphql-subscriptions';
import { JwtService } from '@nestjs/jwt';
import { AnswerResolver } from '../answer.resolver';
import { BrandMention, BrandHealth, BrandMentionAddedPayload, BrandHealthInput } from '../answer.types';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';

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
      }
    };

    return iterator;
  }
}

describe('AnswerResolver', () => {
  let resolver: AnswerResolver;
  let pubSub: MockPubSub;
  let jwtService: JwtService;

  beforeEach(async () => {
    pubSub = new MockPubSub();
    jwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
      verify: jest.fn().mockResolvedValue({ userId: 'test-user-id' }),
    } as unknown as JwtService;

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
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<AnswerResolver>(AnswerResolver);
  });

  describe('brandMentions', () => {
    it('should return brand mentions', async () => {
      const result = await resolver.brandMentions();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('brandHealth', () => {
    it('should return brand health metrics', async () => {
      const input: BrandHealthInput = {
        brandId: 'test-brand',
        startDate: new Date(),
        endDate: new Date(),
      };

      const result = await resolver.brandHealth(input);
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
        context: 'test context',
      };

      const result = await resolver.analyzeContent(input);
      expect(result).toHaveProperty('id');
      expect(result.brandId).toBe(input.brandId);
      expect(result.content).toBe(input.content);
      expect(result.context).toBe(input.context);
    });

    it('should publish brand mention added event', async () => {
      const input = {
        brandId: 'test-brand',
        content: 'test content',
      };

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
