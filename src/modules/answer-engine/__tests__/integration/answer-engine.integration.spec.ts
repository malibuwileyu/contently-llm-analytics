// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Test } from '@nestjs/testing';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { CitationTrackerService } from '../../services/citation-tracker.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrandMentionRepository } from '../../repositories/brand-mention.repository';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BrandMention } from '../../entities/brand-mention.entity';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Citation } from '../../entities/citation.entity';
import { AnalyzeContentDto } from '../../dto/analyze-content.dto';

describe('AnswerEngine Integration', () => {
  let answerEngineService: AnswerEngineService;
  let sentimentAnalyzerService: SentimentAnalyzerService;
  let citationTrackerService: CitationTrackerService;
  let brandMentionRepository: any;
  let nlpService: any;
  let cacheService: any;
  let loggerService: any;
  let authorityCalculator: any;
  let metricsService: any;
  let citationRepository: any;

  beforeEach(async () => {
    // Create mocks for external dependencies
    nlpService = {
      analyzeSentiment: jest.fn().mockResolvedValue({
        score: 0.8,
        magnitude: 0.5,
        aspects: [],
      }),
    };

    // Create a cache with getOrSet implementation
    const cachedValues = new Map<string, any>();
    cacheService = {
      get: jest.fn(async (key: string) => {
        return cachedValues.get(key) || null;
      }),
      set: jest.fn(async (key: string, value: any) => {
        cachedValues.set(key, value);
      }),
      getOrSet: jest.fn(async (key: string, factory: () => Promise<any>) => {
        const cached = cachedValues.get(key);
        if (cached) {
          return cached;
        }
        const value = await factory();
        cachedValues.set(key, value);
        return value;
      }),
    };

    loggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    };

    authorityCalculator = {
      calculateAuthority: jest.fn().mockReturnValue(0.85),
    };

    metricsService = {
      recordAnalysisDuration: jest.fn(),
      incrementErrorCount: jest.fn(),
    };

    // Create a mock repository that simulates database operations
    brandMentionRepository = {
      save: jest.fn(entity => {
        const savedEntity = {
          ...entity,
          id: 'mention-123',
          mentionedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          citations: [],
        };
        return Promise.resolve(savedEntity);
      }),
      findWithCitations: jest.fn(id => {
        return Promise.resolve({
          id,
          brandId: 'brand-123',
          content: 'This is a positive review of the brand.',
          sentiment: 0.8,
          magnitude: 0.5,
          context: {
            query: 'What do people think about this brand?',
            response: 'People generally like this brand.',
            platform: 'twitter',
          },
          mentionedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          citations: [],
        });
      }),
      findByBrandId: jest.fn().mockResolvedValue([
        {
          id: 'mention-1',
          brandId: 'brand-123',
          content: 'Test content 1',
          sentiment: 0.8,
          magnitude: 0.5,
          mentionedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'mention-2',
          brandId: 'brand-123',
          content: 'Test content 2',
          sentiment: 0.6,
          magnitude: 0.4,
          mentionedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ]),
      getSentimentTrend: jest.fn().mockResolvedValue([
        { date: new Date('2023-01-01'), averageSentiment: 0.7 },
        { date: new Date('2023-01-02'), averageSentiment: 0.8 },
      ]),
    };

    // Create a mock citation repository
    citationRepository = {
      create: jest.fn(entity => {
        return {
          ...entity,
          id: undefined,
          createdAt: undefined,
          updatedAt: undefined,
        };
      }),
      save: jest.fn(entity => {
        return Promise.resolve({
          ...entity,
          id: `citation-${Math.floor(Math.random() * 1000)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }),
      find: jest.fn().mockResolvedValue([
        { id: 'citation-1', source: 'https://example.com', authority: 0.85 },
        { id: 'citation-2', source: 'https://another.com', authority: 0.75 },
      ]),
    };

    // Create the SentimentAnalyzerService with mocked dependencies
    sentimentAnalyzerService = new SentimentAnalyzerService(
      nlpService,
      cacheService,
    );

    // Create the CitationTrackerService with mocked dependencies
    citationTrackerService = new CitationTrackerService(
      citationRepository,
      authorityCalculator,
    );

    // Create the AnswerEngineService with all dependencies
    answerEngineService = new AnswerEngineService(
      brandMentionRepository,
      sentimentAnalyzerService,
      citationTrackerService,
      metricsService,
    );
  });

  describe('End-to-end flow', () => {
    it('should analyze content and return a brand mention with sentiment', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a positive review of the brand.',
        context: {
          query: 'What do people think about this brand?',
          response: 'People generally like this brand.',
          platform: 'twitter',
        },
      };

      // Act
      const result = await answerEngineService.analyzeMention(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.brandId).toBe(dto.brandId);
      expect(result.content).toBe(dto.content);
      expect(result.sentiment).toBe(0.8);
      expect(result.magnitude).toBe(0.5);
      expect(result.context).toEqual(dto.context);

      // Verify interactions
      expect(nlpService.analyzeSentiment).toHaveBeenCalledWith(dto.content);
      expect(brandMentionRepository.save).toHaveBeenCalled();
      expect(brandMentionRepository.findWithCitations).toHaveBeenCalled();
      expect(metricsService.recordAnalysisDuration).toHaveBeenCalled();
    });

    it('should analyze content with citations and track them', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a positive review with citations.',
        citations: [
          { source: 'https://example.com', metadata: { page: 1 } },
          { source: 'https://another.com', metadata: { page: 2 } },
        ],
      };

      // Mock the findWithCitations to return a mention with citations
      const mentionWithCitations = {
        id: 'mention-123',
        brandId: dto.brandId,
        content: dto.content,
        sentiment: 0.8,
        magnitude: 0.5,
        context: {},
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: [
          { id: 'citation-1', source: 'https://example.com', authority: 0.85 },
          { id: 'citation-2', source: 'https://another.com', authority: 0.75 },
        ],
      };

      // Override the default mock for this test
      brandMentionRepository.findWithCitations = jest
        .fn()
        .mockResolvedValue(mentionWithCitations);

      // Act
      const result = await answerEngineService.analyzeMention(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.citations).toHaveLength(2);
      expect(result.citations[0].source).toBe('https://example.com');
      expect(result.citations[0].authority).toBe(0.85);
      expect(result.citations[1].source).toBe('https://another.com');
      expect(result.citations[1].authority).toBe(0.75);
    });

    it('should get brand health metrics', async () => {
      // Act
      const result = await answerEngineService.getBrandHealth('brand-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.overallSentiment).toBe(0.7); // Average of 0.8 and 0.6
      expect(result.mentionCount).toBe(2);
      expect(result.trend).toHaveLength(2);
      expect(result.trend[0].date).toEqual(new Date('2023-01-01'));
      expect(result.trend[0].averageSentiment).toBe(0.7);

      // Verify interactions
      expect(brandMentionRepository.findByBrandId).toHaveBeenCalledWith(
        'brand-123',
        expect.any(Object),
      );
      expect(brandMentionRepository.getSentimentTrend).toHaveBeenCalled();
    });

    it('should handle caching in sentiment analysis', async () => {
      // Arrange
      const content = 'This is a test for caching';

      // First call - cache miss
      await sentimentAnalyzerService.analyzeSentiment(content);

      // Mock cache hit for second call
      const cachedResult = { score: 0.9, magnitude: 0.6, aspects: [] };
      cacheService.getOrSet.mockImplementationOnce(
        async (_key: string, _factory: () => Promise<any>) => {
          return cachedResult;
        },
      );

      // Act - second call should use cache
      const result = await sentimentAnalyzerService.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(cachedResult);
      expect(nlpService.analyzeSentiment).toHaveBeenCalledTimes(1); // Only called once
      expect(cacheService.getOrSet).toHaveBeenCalledTimes(2);
    });

    it('should calculate authority for citations', () => {
      // Arrange
      const source = 'https://trusted-source.com';

      // Act
      const authority = authorityCalculator.calculateAuthority(source);

      // Assert
      expect(authority).toBe(0.85);
      expect(authorityCalculator.calculateAuthority).toHaveBeenCalledWith(
        source,
      );
    });
  });

  describe('Error handling', () => {
    it('should handle NLP service errors', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This will cause an error',
      };

      const error = new Error('NLP service unavailable');
      nlpService.analyzeSentiment.mockRejectedValueOnce(error);
      cacheService.getOrSet.mockImplementationOnce(
        async (key: string, factory: () => Promise<any>) => {
          return factory(); // This will now throw the error from nlpService
        },
      );

      // Mock the logger to ensure it's called
      loggerService.error.mockImplementation(() => {});

      // Act & Assert
      await expect(answerEngineService.analyzeMention(dto)).rejects.toThrow(
        error,
      );
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith(
        'analysis_failure',
      );

      // We can't verify the logger is called since it's not injected into the service
      // In a real test, we would need to properly mock the logger service
    });

    it('should handle database errors when saving mentions', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This will cause a database error',
      };

      const error = new Error('Database connection error');
      brandMentionRepository.save.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(answerEngineService.analyzeMention(dto)).rejects.toThrow(
        error,
      );
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith(
        'analysis_failure',
      );
    });

    it('should handle errors when getting brand health', async () => {
      // Arrange
      const brandId = 'error-brand';
      const error = new Error('Failed to retrieve brand mentions');
      brandMentionRepository.findByBrandId.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(answerEngineService.getBrandHealth(brandId)).rejects.toThrow(
        error,
      );
    });
  });

  describe('Performance', () => {
    it('should record analysis duration', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'Performance test content',
      };

      // Act
      await answerEngineService.analyzeMention(dto);

      // Assert
      expect(metricsService.recordAnalysisDuration).toHaveBeenCalled();
    });
  });
});
