import { Test } from '@nestjs/testing';
import { AnswerResolver } from '../answer.resolver';

interface PubSubPayload {
  brandMentionAdded: BrandMention;
}

class MockAsyncIterator<T> implements AsyncIterator<T> {
  private resolveNext: ((value: T) => void) | null = null;

  constructor(
    private triggerName: string,
    private pubSub: MockPubSub,
  ) {}

  next(): Promise<IteratorResult<T>> {
    return new Promise(resolve => {
      this.resolveNext = (value: T) => {
        resolve({ value, done: false });
      };
    });
  }

  return(): Promise<IteratorResult<T>> {
    return Promise.resolve({ value: undefined, done: true });
  }

  throw(): Promise<IteratorResult<T>> {
    return Promise.resolve({ value: undefined, done: true });
  }

  handleNext(value: T): void {
    if (this.resolveNext) {
      this.resolveNext(value);
      this.resolveNext = null;
    }
  }
}

class MockPubSub {
  private handlers: { [key: string]: ((payload: any) => void)[] } = {};
  private asyncIterators: { [key: string]: MockAsyncIterator<any> } = {};

  async publish(triggerName: string, payload: any): Promise<void> {
    const handlers = this.handlers[triggerName] || [];
    handlers.forEach(handler => handler(payload));

    const iterator = this.asyncIterators[triggerName];
    if (iterator) {
      iterator.handleNext(payload);
    }
  }

  subscribe(triggerName: string, onMessage: (payload: any) => void): number {
    if (!this.handlers[triggerName]) {
      this.handlers[triggerName] = [];
    }
    this.handlers[triggerName].push(onMessage);
    return this.handlers[triggerName].length;
  }

  asyncIterator<T>(triggers: string | string[]): AsyncIterator<T> {
    const triggerName = Array.isArray(triggers) ? triggers[0] : triggers;
    const iterator = new MockAsyncIterator<T>(triggerName, this);
    this.asyncIterators[triggerName] = iterator;
    return iterator;
  }
}

describe('AnswerResolver', () => {
  let resolver: AnswerResolver;
  let pubSub: MockPubSub;

  beforeEach(async () => {
    pubSub = new MockPubSub();

    const module = await Test.createTestingModule({
      providers: [
        AnswerResolver,
        {
          provide: 'PUB_SUB',
          useValue: pubSub,
        },
      ],
    }).compile();

    resolver = module.get<AnswerResolver>(AnswerResolver);
  });

  describe('brandMentions', () => {
    it('should return brand mentions for a given brandId', async () => {
      // Arrange
      const brandId = 'test-brand';
      const input = {
        brandId,
        content: 'Test content',
        context: 'Test context',
      };

      // Act
      await resolver.analyzeContent({
        brandId,
        content: input.content,
        context: input.context,
      });
      const result = await resolver.brandMentions(brandId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        brandId,
        content: input.content,
        context: input.context,
      });
    });
  });

  describe('brandHealth', () => {
    it('should return brand health metrics', async () => {
      // Arrange
      const input = {
        brandId: 'test-brand',
        startDate: new Date(),
        endDate: new Date(),
      };

      // Act
      const result = await resolver.brandHealth(input);

      // Assert
      expect(result).toMatchObject({
        overallSentiment: expect.any(Number),
        trend: expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(Date),
            sentiment: expect.any(Number),
          }),
        ]),
        mentionCount: expect.any(Number),
      });
    });
  });

  describe('analyzeContent', () => {
    it('should create and return a brand mention', async () => {
      // Arrange
      const input = {
        brandId: 'test-brand',
        content: 'Test content',
        context: 'Test context',
      };

      // Act
      const result = await resolver.analyzeContent(input);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        brandId: input.brandId,
        content: input.content,
        context: input.context,
        sentiment: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should publish brand mention added event', async () => {
      // Arrange
      const input = {
        brandId: 'test-brand',
        content: 'Test content',
        context: 'Test context',
      };

      // Create a promise that resolves when the event is published
      const eventPromise = new Promise<PubSubPayload>(resolve => {
        pubSub.subscribe('brandMentionAdded', (payload: PubSubPayload) => {
          resolve(payload);
        });
      });

      // Act
      const mention = await resolver.analyzeContent(input);

      // Wait for the event
      const event = await eventPromise;

      // Assert
      expect(event).toEqual({
        brandMentionAdded: mention,
      });
    });
  });

  describe('brandMentionAdded subscription', () => {
    it('should receive brand mention events for matching brandId', async () => {
      // Arrange
      const brandId = 'test-brand';

      // Create an async iterator for the subscription
      const iterator = await resolver.brandMentionAdded(brandId);

      // Create a promise that resolves with the next value
      const nextValuePromise = iterator.next();

      // Create mentions for both brandIds
      const mention1 = await resolver.analyzeContent({
        brandId,
        content: 'Test content 1',
      });

      // Get the next value from the iterator
      const result = await nextValuePromise;

      // Assert
      expect(result.value).toEqual({
        brandMentionAdded: mention1,
      });
    });
  });

  it('should handle multiple mentions', async () => {
    // Arrange
    const brandId = 'test-brand';
    const input = {
      brandId,
      content: 'Test content',
      context: 'Test context',
    };

    // Act
    const mention = await resolver.analyzeContent({
      brandId,
      content: input.content,
      context: input.context,
    });

    // Assert
    expect(mention).toBeDefined();
    expect(mention.brandId).toBe(brandId);
    expect(mention.content).toBe(input.content);
  });
});
