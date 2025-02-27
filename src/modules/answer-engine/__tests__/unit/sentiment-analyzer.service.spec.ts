import { Test, TestingModule } from '@nestjs/testing';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { CacheService } from '../../../../cache/cache.service';
import { SentimentAnalysis } from '../../interfaces/sentiment-analysis.interface';

// Define the NLPService interface
interface NLPService {
  analyzeSentiment(content: string): Promise<SentimentAnalysis>;
}

describe('SentimentAnalyzerService', () => {
  let service: SentimentAnalyzerService;
  let nlpService: any;
  let cacheService: any;

  beforeEach(async () => {
    // Create mocks
    nlpService = {
      analyzeSentiment: jest.fn()
    };

    cacheService = {
      getOrSet: jest.fn()
    };

    // Create the service directly without using NestJS DI
    service = new SentimentAnalyzerService(nlpService, cacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSentiment', () => {
    it('should return cached sentiment analysis if available', async () => {
      // Arrange
      const content = 'This is a test content';
      const expectedResult: SentimentAnalysis = {
        score: 0.8,
        magnitude: 0.5,
        aspects: []
      };

      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return expectedResult;
      });

      // Act
      const result = await service.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('sentiment:'),
        expect.any(Function),
        expect.any(Number)
      );
      expect(nlpService.analyzeSentiment).not.toHaveBeenCalled();
    });

    it('should call NLP service and cache result if not in cache', async () => {
      // Arrange
      const content = 'This is a test content';
      const expectedResult: SentimentAnalysis = {
        score: 0.8,
        magnitude: 0.5,
        aspects: []
      };

      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return factory();
      });

      nlpService.analyzeSentiment.mockResolvedValue(expectedResult);

      // Act
      const result = await service.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.stringContaining('sentiment:'),
        expect.any(Function),
        expect.any(Number)
      );
      expect(nlpService.analyzeSentiment).toHaveBeenCalledWith(content);
    });

    it('should handle empty content', async () => {
      // Arrange
      const content = '';
      const expectedResult: SentimentAnalysis = {
        score: 0,
        magnitude: 0,
        aspects: []
      };

      nlpService.analyzeSentiment.mockResolvedValue(expectedResult);
      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return factory();
      });

      // Act
      const result = await service.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should handle errors from NLP service', async () => {
      // Arrange
      const content = 'This is a test content';
      const error = new Error('NLP service error');

      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return factory();
      });

      nlpService.analyzeSentiment.mockRejectedValue(error);

      // Act & Assert
      await expect(service.analyzeSentiment(content)).rejects.toThrow(error);
    });

    it('should handle extremely long content', async () => {
      // Arrange
      const content = 'A'.repeat(10000); // Very long content
      const expectedResult: SentimentAnalysis = {
        score: 0.5,
        magnitude: 0.3,
        aspects: []
      };

      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return factory();
      });

      nlpService.analyzeSentiment.mockResolvedValue(expectedResult);

      // Act
      const result = await service.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(nlpService.analyzeSentiment).toHaveBeenCalledWith(content);
    });

    it('should handle content with special characters', async () => {
      // Arrange
      const content = 'Special characters: !@#$%^&*()_+{}|:"<>?[];\',./-=';
      const expectedResult: SentimentAnalysis = {
        score: 0,
        magnitude: 0.1,
        aspects: []
      };

      cacheService.getOrSet.mockImplementation(async (key: string, factory: () => Promise<any>, ttl?: number) => {
        return factory();
      });

      nlpService.analyzeSentiment.mockResolvedValue(expectedResult);

      // Act
      const result = await service.analyzeSentiment(content);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(nlpService.analyzeSentiment).toHaveBeenCalledWith(content);
    });
  });
}); 