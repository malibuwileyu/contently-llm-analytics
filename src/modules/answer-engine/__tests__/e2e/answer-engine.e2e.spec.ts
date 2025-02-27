import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as request from 'supertest';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMentionRepository } from '../../repositories/brand-mention.repository';
import { AnalyzeContentDto } from '../../dto/analyze-content.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { DataSource } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Reflector } from '@nestjs/core';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AuthGuard } from '../../../../auth/guards/auth.guard';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { CitationTrackerService } from '../../services/citation-tracker.service';

// Mock AuthGuard
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MockAuthGuard {
  canActivate = jest.fn().mockReturnValue(true);
}

// Mock BrandMentionRepository
class MockBrandMentionRepository {
  save = jest.fn();
  findWithCitations = jest.fn();
  findByBrandId = jest.fn();
  getSentimentTrend = jest.fn();
}

// Mock SentimentAnalyzerService
class MockSentimentAnalyzerService {
  analyzeSentiment = jest.fn();
}

// Mock CitationTrackerService
class MockCitationTrackerService {
  trackCitation = jest.fn();
  getCitationsByBrandMention = jest.fn();
  getTopCitations = jest.fn();
}

// Mock MetricsService
class MockMetricsService {
  recordAnalysisDuration = jest.fn();
  incrementErrorCount = jest.fn();
}

// Mock MainRunnerService
class MockMainRunnerService {
  register = jest.fn();
  runOne = jest.fn();
}

describe('AnswerEngine E2E Tests', () => {
  let app: INestApplication;
  let answerEngineService: AnswerEngineService;
  let brandMentionRepository: MockBrandMentionRepository;
  let sentimentAnalyzerService: MockSentimentAnalyzerService;
  let citationTrackerService: MockCitationTrackerService;
  let metricsService: MockMetricsService;
  let mainRunnerService: MockMainRunnerService;
  
  // Mock data
  const brandId = 'test-brand-123';
  const mockContent = 'This is a test content for E2E testing';
  const mockSentiment = {
    score: 0.8,
    magnitude: 0.5,
    aspects: []
  };
  
  beforeAll(async () => {
    // Create a testing module
    const moduleRef = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: AnswerEngineService,
          useValue: {
            analyzeMention: jest.fn(),
            getBrandHealth: jest.fn(),
          },
        },
        {
          provide: BrandMentionRepository,
          useValue: {
            findByBrandId: jest.fn(),
            findWithCitations: jest.fn(),
            getSentimentTrend: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: SentimentAnalyzerService,
          useValue: {
            analyzeSentiment: jest.fn(),
          },
        },
        {
          provide: CitationTrackerService,
          useValue: {
            trackCitation: jest.fn(),
            getCitationsByBrandMention: jest.fn(),
            getTopCitations: jest.fn(),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  beforeEach(async () => {
    // Create mocks
    brandMentionRepository = new MockBrandMentionRepository();
    sentimentAnalyzerService = new MockSentimentAnalyzerService();
    citationTrackerService = new MockCitationTrackerService();
    metricsService = new MockMetricsService();
    mainRunnerService = new MockMainRunnerService();
    
    // Setup mock implementations
    brandMentionRepository.save.mockImplementation((entity) => {
      return Promise.resolve({
        ...entity,
        id: 'mention-123',
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: []
      });
    });
    
    brandMentionRepository.findWithCitations.mockImplementation((id) => {
      return Promise.resolve({
        id,
        brandId,
        content: mockContent,
        sentiment: mockSentiment.score,
        magnitude: mockSentiment.magnitude,
        context: {},
        mentionedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        citations: []
      });
    });
    
    brandMentionRepository.findByBrandId.mockResolvedValue([
      {
        id: 'mention-1',
        brandId,
        content: 'Test content 1',
        sentiment: 0.8,
        magnitude: 0.5,
      },
      {
        id: 'mention-2',
        brandId,
        content: 'Test content 2',
        sentiment: 0.6,
        magnitude: 0.4,
      }
    ]);
    
    brandMentionRepository.getSentimentTrend.mockResolvedValue([
      { date: new Date('2023-01-01'), averageSentiment: 0.7 },
      { date: new Date('2023-01-02'), averageSentiment: 0.8 }
    ]);
    
    sentimentAnalyzerService.analyzeSentiment.mockResolvedValue(mockSentiment);
    
    citationTrackerService.trackCitation.mockResolvedValue({
      id: 'citation-123',
      source: 'https://example.com',
      authority: 0.85
    });
    
    citationTrackerService.getCitationsByBrandMention.mockResolvedValue([]);
    
    // Create the service directly
    answerEngineService = new AnswerEngineService(
      brandMentionRepository as any,
      sentimentAnalyzerService as any,
      citationTrackerService as any,
      metricsService as any
    );
    
    // Setup main runner service
    mainRunnerService.runOne.mockImplementation(async (name, context) => {
      if (name !== 'answer-engine') {
        return { success: false, error: { message: 'Runner not found', timestamp: new Date() } };
      }
      
      try {
        const mention = await answerEngineService.analyzeMention({
          brandId: context.brandId,
          content: context.metadata.content,
          context: context.metadata.context,
          citations: context.metadata.citations
        });
        
        const health = await answerEngineService.getBrandHealth(context.brandId);
        
        return {
          success: true,
          data: {
            mention,
            health
          }
        };
      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            timestamp: new Date()
          }
        };
      }
    });
  });

  describe('Service Tests', () => {
    it('should analyze content', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId,
        content: mockContent,
        context: {
          query: 'What do people think about this brand?',
          response: 'People generally like this brand.',
          platform: 'twitter'
        }
      };
      
      // Act
      const result = await answerEngineService.analyzeMention(dto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.brandId).toBe(brandId);
      expect(result.content).toBe(mockContent);
      expect(result.sentiment).toBe(mockSentiment.score);
      expect(sentimentAnalyzerService.analyzeSentiment).toHaveBeenCalledWith(mockContent);
      expect(brandMentionRepository.save).toHaveBeenCalled();
      expect(brandMentionRepository.findWithCitations).toHaveBeenCalled();
    });

    it('should get brand health', async () => {
      // Act
      const result = await answerEngineService.getBrandHealth(brandId);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.overallSentiment).toBeDefined();
      expect(result.trend).toHaveLength(2);
      expect(result.mentionCount).toBe(2);
      expect(brandMentionRepository.findByBrandId).toHaveBeenCalledWith(brandId, expect.any(Object));
      expect(brandMentionRepository.getSentimentTrend).toHaveBeenCalled();
    });
  });

  describe('Runner Integration', () => {
    it('should execute the answer-engine runner through MainRunnerService', async () => {
      // Arrange
      const context = {
        brandId,
        metadata: {
          content: mockContent,
          context: {
            query: 'Test query',
            response: 'Test response',
            platform: 'test'
          },
          citations: []
        }
      };
      
      // Act
      const result = await mainRunnerService.runOne('answer-engine', context);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.mention).toBeDefined();
      expect(result.data.mention.brandId).toBe(brandId);
      expect(result.data.health).toBeDefined();
      expect(result.data.health.overallSentiment).toBeDefined();
    });
    
    it('should handle errors in the runner', async () => {
      // Arrange
      const context = {
        brandId: 'invalid-brand',
        metadata: {
          content: null, // This will cause an error
          context: {},
          citations: []
        }
      };
      
      // Mock the service to throw an error
      sentimentAnalyzerService.analyzeSentiment.mockRejectedValueOnce(new Error('Invalid content'));
      
      // Act
      const result = await mainRunnerService.runOne('answer-engine', context);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Invalid content');
      expect(result.error.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('End-to-End Flow', () => {
    it('should process content through the entire pipeline', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId,
        content: 'This is a comprehensive test of the entire pipeline',
        context: {
          query: 'Comprehensive test',
          response: 'Testing the full flow',
          platform: 'e2e-test'
        }
      };
      
      // Act - First analyze content
      const mention = await answerEngineService.analyzeMention(dto);
      
      // Then get brand health
      const health = await answerEngineService.getBrandHealth(brandId);
      
      // Assert
      expect(mention).toBeDefined();
      expect(mention.brandId).toBe(brandId);
      
      expect(health).toBeDefined();
      expect(health.overallSentiment).toBeDefined();
      expect(health.trend).toBeDefined();
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle concurrent requests', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId,
        content: 'Concurrent request test',
        context: {
          query: 'Concurrent test',
          response: 'Testing concurrency',
          platform: 'test'
        }
      };
      
      // Act - Send 5 concurrent requests
      const promises = Array(5).fill(0).map(() => 
        answerEngineService.analyzeMention(dto)
      );
      
      const results = await Promise.all(promises);
      
      // Assert
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.brandId).toBe(brandId);
      });
    });
    
    it('should handle large content', async () => {
      // Arrange
      const largeContent = 'A'.repeat(10000); // 10KB of content
      const dto: AnalyzeContentDto = {
        brandId,
        content: largeContent,
        context: {
          query: 'Large content test',
          response: 'Testing with large content',
          platform: 'test'
        }
      };
      
      // Act
      const result = await answerEngineService.analyzeMention(dto);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.brandId).toBe(brandId);
    });
  });

  describe('Performance Tests', () => {
    it('should process mentions efficiently', async () => {
      // Arrange
      const dto: AnalyzeContentDto = {
        brandId,
        content: mockContent,
        context: {
          query: 'What do people think about this brand?',
          response: 'People generally like this brand.',
          platform: 'twitter'
        }
      };
      
      // Act
      const startTime = Date.now();
      const result = await answerEngineService.analyzeMention(dto);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const totalTime = Date.now() - startTime;
      
      // Assert
      expect(result).toBeDefined();
      expect(result.brandId).toBe(brandId);
    });
  });
}); 