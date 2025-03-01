import { Test, TestingModule } from '@nestjs/testing';
import { AnswerResolver } from '../../graphql/answer.resolver';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMention } from '../../entities/brand-mention.entity';
import {
  BrandHealth,
  SentimentTrend,
} from '../../interfaces/sentiment-analysis.interface';
import { AnalyzeContentDto } from '../../dto/analyze-content.dto';
import { BrandHealthInput } from '../../dto/brand-mention.dto';
import { AuthGuard } from '../../../../auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

// Create a mock PubSub class
class MockPubSub {
  publish = jest.fn().mockResolvedValue(undefined);
  asyncIterator = jest.fn().mockReturnValue({
    [Symbol.asyncIterator]: () => ({
      _next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
    }),
  });
}

// Mock AuthGuard
class MockAuthGuard {
  canActivate = jest.fn().mockReturnValue(true);
}

describe('AnswerResolver', () => {
  let resolver: AnswerResolver;
  let answerEngineService: Partial<AnswerEngineService>;
  let pubSub: MockPubSub;

  beforeEach(async () => {
    // Create mocks
    answerEngineService = {
      analyzeMention: jest.fn(),
      getBrandHealth: jest.fn(),
    };

    pubSub = new MockPubSub();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerResolver,
        {
          provide: AnswerEngineService,
          useValue: answerEngineService,
        },
        {
          provide: 'PUB_SUB',
          useValue: pubSub,
        },
        {
          provide: AuthGuard,
          useClass: MockAuthGuard,
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest
              .fn()
              .mockReturnValue({ sub: 'user-123', roles: ['admin'] }),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AnswerResolver>(AnswerResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getRecentMentions', () => {
    it('should return recent mentions for a brand', async () => {
      // Arrange
      const brandId = 'brand-123';
      const limit = 5;
      const sentimentTrend: SentimentTrend[] = [
        { date: new Date('2023-01-01'), averageSentiment: 0.7 },
        { date: new Date('2023-01-02'), averageSentiment: 0.8 },
      ];
      const health: BrandHealth = {
        overallSentiment: 0.75,
        trend: sentimentTrend,
        mentionCount: 2,
      };

      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue(
        health,
      );

      // Act
      const result = await resolver.getRecentMentions(brandId, limit);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].brandId).toBe(brandId);
      expect(result[0].sentiment).toBe(sentimentTrend[0].averageSentiment);
      expect(answerEngineService.getBrandHealth).toHaveBeenCalledWith(brandId);
    });
  });

  describe('getBrandHealth', () => {
    it('should return brand health metrics', async () => {
      // Arrange
      const input: BrandHealthInput = {
        brandId: 'brand-123',
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      const sentimentTrend: SentimentTrend[] = [
        { date: new Date('2023-01-01'), averageSentiment: 0.7 },
        { date: new Date('2023-01-02'), averageSentiment: 0.8 },
      ];

      const health: BrandHealth = {
        overallSentiment: 0.75,
        trend: sentimentTrend,
        mentionCount: 2,
      };

      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue(
        health,
      );

      // Act
      const result = await resolver.getBrandHealth(input);

      // Assert
      expect(result).toEqual({
        overallSentiment: health.overallSentiment,
        trend: health.trend.map(point => ({
          date: point.date,
          sentiment: point.averageSentiment,
        })),
        mentionCount: health.mentionCount,
      });
      expect(answerEngineService.getBrandHealth).toHaveBeenCalledWith(
        input.brandId,
      );
    });
  });

  describe('analyzeContent', () => {
    it('should analyze content and publish event', async () => {
      // Arrange
      const data: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a test content',
        context: {
          query: 'test query',
          response: 'test response',
          platform: 'test platform',
        },
      };

      const mention: BrandMention = {
        id: 'mention-123',
        brandId: data.brandId,
        content: data.content,
        sentiment: 0.8,
        magnitude: 0.5,
        mentionedAt: new Date(),
        context: data.context as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null as unknown as Date,
        citations: [],
      };

      (answerEngineService.analyzeMention as jest.Mock).mockResolvedValue(
        mention,
      );

      // Act
      const result = await resolver.analyzeContent(data);

      // Assert
      expect(result).toEqual({
        id: mention.id,
        brandId: mention.brandId,
        content: mention.content,
        sentiment: mention.sentiment,
        context: JSON.stringify(mention.context),
        createdAt: mention.createdAt,
        updatedAt: mention.updatedAt,
      });

      expect(answerEngineService.analyzeMention).toHaveBeenCalledWith(data);
      expect(pubSub.publish).toHaveBeenCalledWith('brandMentionAdded', {
        brandMentionAdded: result,
      });
    });
  });

  describe('brandMentionAdded', () => {
    it('should return an async iterator for the subscription', () => {
      // Arrange
      const brandId = 'brand-123';

      // Act
      const result = resolver.brandMentionAdded(brandId);

      // Assert
      expect(result).toBeDefined();
      expect(pubSub.asyncIterator).toHaveBeenCalledWith('brandMentionAdded');
    });
  });
});
