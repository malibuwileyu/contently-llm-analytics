// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Test, TestingModule } from '@nestjs/testing';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMentionRepository } from '../../repositories/brand-mention.repository';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { CitationTrackerService } from '../../services/citation-tracker.service';
import { BrandMention } from '../../entities/brand-mention.entity';
import { Citation } from '../../entities/citation.entity';
import {
  AnalyzeContentDto,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CitationDto,
} from '../../dto/analyze-content.dto';
import { SentimentTrend } from '../../interfaces/sentiment-analysis.interface';

// Define the MetricsService interface
interface MetricsService {
  recordAnalysisDuration(duration: number): void;
  incrementErrorCount(type: string): void;
}

describe('AnswerEngineService', () => {
  let service: AnswerEngineService;
  let brandMentionRepository: jest.Mocked<BrandMentionRepository>;
  let sentimentAnalyzer: jest.Mocked<SentimentAnalyzerService>;
  let citationTracker: jest.Mocked<CitationTrackerService>;
  let metricsService: MetricsService;

  beforeEach(async () => {
    // Create mocks
    brandMentionRepository = {
      save: jest.fn(),
      _findOne: jest.fn(),
      find: jest.fn(),
      findByBrandId: jest.fn(),
      findWithCitations: jest.fn(),
      getSentimentTrend: jest.fn(),
    } as any;

    sentimentAnalyzer = {
      analyzeSentiment: jest.fn(),
    } as any;

    citationTracker = {
      trackCitation: jest.fn(),
      getCitationsByBrandMention: jest.fn(),
      getTopCitations: jest.fn(),
    } as any;

    metricsService = {
      recordAnalysisDuration: jest.fn(),
      incrementErrorCount: jest.fn(),
    };

    // Create a test module with direct instantiation instead of dependency injection
    const answerEngineService = new AnswerEngineService(
      brandMentionRepository,
      sentimentAnalyzer,
      citationTracker,
      metricsService,
    );

    service = answerEngineService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeMention', () => {
    it('should analyze content and create a brand mention', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a test content',
        context: {
          query: 'test query',
          response: 'test response',
          platform: 'test platform',
        },
      };

      const sentiment = {
        score: 0.8,
        magnitude: 0.5,
        aspects: [],
      };

      const savedMention = {
        id: 'mention-123',
        brandId: dto.brandId,
        content: dto.content,
        sentiment: sentiment.score,
        magnitude: sentiment.magnitude,
        context: {},
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: [],
      } as unknown as BrandMention;

      sentimentAnalyzer.analyzeSentiment.mockResolvedValue(sentiment);
      brandMentionRepository.save.mockResolvedValue(savedMention);
      brandMentionRepository.findWithCitations.mockResolvedValue(savedMention);

      // Act
      const result = await service.analyzeMention(dto);

      // Assert
      expect(result).toEqual(savedMention);
      expect(sentimentAnalyzer.analyzeSentiment).toHaveBeenCalledWith(
        dto.content,
      );
      expect(brandMentionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          brandId: dto.brandId,
          content: dto.content,
          sentiment: sentiment.score,
          context: dto.context,
        }),
      );
      expect(brandMentionRepository.findWithCitations).toHaveBeenCalledWith(
        savedMention.id,
      );
      expect(metricsService.recordAnalysisDuration).toHaveBeenCalled();
    });

    it('should track citations if provided', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a test content',
        citations: [
          { source: 'https://example.com', metadata: { page: 1 } },
          { source: 'https://another.com', metadata: { page: 2 } },
        ],
      };

      const sentiment = {
        score: 0.8,
        magnitude: 0.5,
        aspects: [],
      };

      const savedMention = {
        id: 'mention-123',
        brandId: dto.brandId,
        content: dto.content,
        sentiment: sentiment.score,
        magnitude: sentiment.magnitude,
        context: {},
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: [],
      } as unknown as BrandMention;

      const mentionWithCitations = {
        ...savedMention,
        citations: [
          { id: 'citation-1', source: 'https://example.com', authority: 0.8 },
          { id: 'citation-2', source: 'https://another.com', authority: 0.6 },
        ],
      } as unknown as BrandMention;

      sentimentAnalyzer.analyzeSentiment.mockResolvedValue(sentiment);
      brandMentionRepository.save.mockResolvedValue(savedMention);
      brandMentionRepository.findWithCitations.mockResolvedValue(
        mentionWithCitations,
      );
      citationTracker.trackCitation.mockResolvedValue({} as Citation);

      // Act
      const result = await service.analyzeMention(dto);

      // Assert
      expect(result).toEqual(mentionWithCitations);
      expect(citationTracker.trackCitation).toHaveBeenCalledTimes(2);
      expect(citationTracker.trackCitation).toHaveBeenCalledWith(
        expect.objectContaining({
          source: dto.citations?.[0].source,
          brandMention: savedMention,
        }),
      );
    });

    it('should handle errors during analysis', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: 'This is a test content',
      };

      const error = new Error('Analysis error');
      sentimentAnalyzer.analyzeSentiment.mockRejectedValue(error);

      // Act & Assert
      await expect(service.analyzeMention(dto)).rejects.toThrow(error);
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith(
        'analysis_failure',
      );
    });

    it('should handle empty content', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId: 'brand-123',
        content: '',
      };

      const sentiment = {
        score: 0,
        magnitude: 0,
        aspects: [],
      };

      const savedMention = {
        id: 'mention-123',
        brandId: dto.brandId,
        content: dto.content,
        sentiment: sentiment.score,
        magnitude: sentiment.magnitude,
        context: {},
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: [],
      } as unknown as BrandMention;

      sentimentAnalyzer.analyzeSentiment.mockResolvedValue(sentiment);
      brandMentionRepository.save.mockResolvedValue(savedMention);
      brandMentionRepository.findWithCitations.mockResolvedValue(savedMention);

      // Act
      const result = await service.analyzeMention(dto);

      // Assert
      expect(result).toEqual(savedMention);
      expect(result.sentiment).toBe(0);
    });
  });

  describe('getBrandHealth', () => {
    it('should return brand health metrics', async () => {
      // Arrange
      const brandId = 'brand-123';
      const mentions = [
        { id: 'mention-1', sentiment: 0.8 },
        { id: 'mention-2', sentiment: 0.6 },
      ] as BrandMention[];

      const sentimentTrend: SentimentTrend[] = [
        { date: new Date('2023-01-01'), averageSentiment: 0.7 },
        { date: new Date('2023-01-02'), averageSentiment: 0.8 },
      ];

      const topCitations = [
        { source: 'source-1', authority: 0.9 },
        { source: 'source-2', authority: 0.8 },
      ];

      brandMentionRepository.findByBrandId.mockResolvedValue(mentions);
      brandMentionRepository.getSentimentTrend.mockResolvedValue(
        sentimentTrend,
      );
      citationTracker.getCitationsByBrandMention.mockResolvedValue([
        { source: 'source-1', authority: 0.9 },
        { source: 'source-2', authority: 0.8 },
      ] as Citation[]);

      // Act
      const result = await service.getBrandHealth(brandId);

      // Assert
      expect(result).toEqual({
        overallSentiment: 0.7, // (0.8 + 0.6) / 2
        trend: sentimentTrend,
        mentionCount: 2,
        topCitations,
      });
      expect(brandMentionRepository.findByBrandId).toHaveBeenCalledWith(
        brandId,
        expect.any(Object),
      );
      expect(brandMentionRepository.getSentimentTrend).toHaveBeenCalledWith(
        brandId,
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return default values when no mentions found', async () => {
      // Arrange
      const brandId = 'brand-123';
      brandMentionRepository.findByBrandId.mockResolvedValue([]);
      brandMentionRepository.getSentimentTrend.mockResolvedValue([]);
      citationTracker.getCitationsByBrandMention.mockResolvedValue([]);

      // Act
      const result = await service.getBrandHealth(brandId);

      // Assert
      expect(result).toEqual({
        overallSentiment: 0,
        trend: [],
        mentionCount: 0,
        topCitations: [],
      });
    });

    it('should handle errors when getting brand health', async () => {
      // Arrange
      const brandId = 'brand-123';
      const error = new Error('Database error');
      brandMentionRepository.findByBrandId.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getBrandHealth(brandId)).rejects.toThrow(error);
    });
  });

  describe('calculateOverallSentiment', () => {
    it('should calculate average sentiment from mentions', () => {
      // Arrange
      const mentions = [
        { sentiment: 0.8 },
        { sentiment: 0.6 },
        { sentiment: 0.7 },
      ] as BrandMention[];

      // Act
      // @ts-ignore - accessing private method for testing
      const result = service['calculateOverallSentiment'](mentions);

      // Assert
      expect(result).toBeCloseTo(0.7, 5); // (0.8 + 0.6 + 0.7) / 3
    });

    it('should return 0 when no mentions provided', () => {
      // Act
      // @ts-ignore - accessing private method for testing
      const result = service['calculateOverallSentiment']([]);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('getTopCitations', () => {
    it('should return top citations sorted by authority', async () => {
      // Arrange
      const mentions = [{ id: 'mention-1' }] as BrandMention[];

      const citations = [
        { source: 'source-1', authority: 0.7 },
        { source: 'source-2', authority: 0.9 },
        { source: 'source-3', authority: 0.8 },
      ] as Citation[];

      citationTracker.getCitationsByBrandMention.mockResolvedValue(citations);

      // Act
      // @ts-ignore - accessing private method for testing
      const result = await service['getTopCitations'](mentions);

      // Assert
      expect(result).toEqual([
        { source: 'source-2', authority: 0.9 },
        { source: 'source-3', authority: 0.8 },
        { source: 'source-1', authority: 0.7 },
      ]);
    });

    it('should limit to top 10 citations', async () => {
      // Arrange
      const mentions = [{ id: 'mention-1' }] as BrandMention[];

      const citations = Array.from({ length: 15 }, (_, i) => ({
        source: `source-${i}`,
        authority: 0.9 - i * 0.05,
      })) as Citation[];

      citationTracker.getCitationsByBrandMention.mockResolvedValue(citations);

      // Act
      // @ts-ignore - accessing private method for testing
      const result = await service['getTopCitations'](mentions);

      // Assert
      expect(result).toHaveLength(10);
      expect(result[0].authority).toBeGreaterThan(result[9].authority);
    });

    it('should return empty array when no mentions or citations', async () => {
      // Arrange
      citationTracker.getCitationsByBrandMention.mockResolvedValue([]);

      // Act
      // @ts-ignore - accessing private method for testing
      const result = await service['getTopCitations']([]);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
