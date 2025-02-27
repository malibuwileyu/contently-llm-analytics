import { Test, TestingModule } from '@nestjs/testing';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import { TopicGapAnalyzerService } from '../services/topic-gap-analyzer.service';
import { TopicClusteringService } from '../services/topic-clustering.service';
import { Logger } from '@nestjs/common';

describe('ContentSuggestionService', () => {
  let service: ContentSuggestionService;
  let mockTopicGapAnalyzerService: any;
  let mockTopicClusteringService: any;
  let mockCacheService: any;

  beforeEach(async () => {
    // Create mock topic gap analyzer service
    mockTopicGapAnalyzerService = {
      analyzeTopicGaps: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          gaps: [
            {
              topic: 'subscription',
              gapScore: 0.75,
              relatedTopics: ['pricing', 'plan', 'discount'],
              frequency: 25,
              exampleQuestions: [
                'How do I change my subscription plan?',
                'What are the pricing options for premium plans?',
                'Can I get a discount on annual subscriptions?'
              ],
              suggestedContentAreas: [
                'subscription overview',
                'subscription guide',
                'subscription and pricing',
                'subscription and plan',
                'how to subscription'
              ]
            },
            {
              topic: 'billing',
              gapScore: 0.65,
              relatedTopics: ['payment', 'invoice', 'refund'],
              frequency: 18,
              exampleQuestions: [
                'How do I update my billing information?',
                'When will I be charged for my subscription?'
              ],
              suggestedContentAreas: [
                'billing overview',
                'billing guide',
                'billing and payment',
                'billing and invoice',
                'how to billing'
              ]
            }
          ],
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          totalTopicsAnalyzed: 50,
          totalConversationsAnalyzed: 100
        });
      })
    };

    // Create mock topic clustering service
    mockTopicClusteringService = {
      clusterTopics: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          clusters: [
            {
              centralTopic: 'subscription',
              relatedTopics: ['pricing', 'plan', 'discount', 'payment'],
              strength: 0.85,
              frequency: 30
            },
            {
              centralTopic: 'billing',
              relatedTopics: ['payment', 'invoice', 'refund', 'credit card'],
              strength: 0.75,
              frequency: 22
            }
          ],
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          totalTopicsAnalyzed: 50,
          totalClustersFound: 8
        });
      })
    };

    // Create mock cache service
    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, factory) => {
        return factory();
      })
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentSuggestionService,
        {
          provide: TopicGapAnalyzerService,
          useValue: mockTopicGapAnalyzerService
        },
        {
          provide: TopicClusteringService,
          useValue: mockTopicClusteringService
        },
        {
          provide: 'CacheService',
          useValue: mockCacheService
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<ContentSuggestionService>(ContentSuggestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('suggestContent', () => {
    it('should use cache service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.suggestContent(brandId, options);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should return content suggestion results', async () => {
      const brandId = 'test-brand';
      const result = await service.suggestContent(brandId);

      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.totalTopicsAnalyzed).toBeDefined();
      expect(result.totalGapsAnalyzed).toBeDefined();
    });

    it('should call topic gap analyzer service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
        minGapScore: 0.3
      };

      await service.suggestContent(brandId, options);

      expect(mockTopicGapAnalyzerService.analyzeTopicGaps).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: options.startDate,
          endDate: options.endDate,
          minGapScore: options.minGapScore
        })
      );
    });

    it('should call topic clustering service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.suggestContent(brandId, options);

      expect(mockTopicClusteringService.clusterTopics).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: options.startDate,
          endDate: options.endDate
        })
      );
    });

    it('should generate content suggestions from gaps and clusters', async () => {
      const brandId = 'test-brand';
      const result = await service.suggestContent(brandId);

      // Should have suggestions based on the mock data
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Check if the suggestions have the expected properties
      const suggestion = result.suggestions[0];
      expect(suggestion.title).toBeDefined();
      expect(suggestion.type).toBeDefined();
      expect(suggestion.priority).toBeGreaterThan(0);
      expect(suggestion.topics).toBeDefined();
      expect(suggestion.gapScore).toBeGreaterThan(0);
      expect(suggestion.estimatedImpact).toBeGreaterThan(0);
      expect(suggestion.exampleQuestions).toBeDefined();
      expect(suggestion.suggestedOutline).toBeDefined();
    });

    it('should respect content type preferences', async () => {
      const brandId = 'test-brand';
      const options = {
        contentTypes: ['video', 'FAQ']
      };

      const result = await service.suggestContent(brandId, options);

      // All suggestions should have one of the specified content types
      for (const suggestion of result.suggestions) {
        expect(options.contentTypes).toContain(suggestion.type);
      }
    });

    it('should respect limit option', async () => {
      const brandId = 'test-brand';
      const limit = 1;
      const options = { limit };

      const result = await service.suggestContent(brandId, options);

      expect(result.suggestions.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('private methods', () => {
    it('should determine appropriate content type', () => {
      // Gap with many example questions should be FAQ
      const faqGap = {
        topic: 'test',
        exampleQuestions: ['q1', 'q2', 'q3'],
        relatedTopics: []
      };
      
      // @ts-ignore - accessing private method for testing
      expect(service.determineContentType(faqGap, null, ['article', 'FAQ'])).toBe('FAQ');
      
      // Gap with high gap score should be guide
      const highScoreGap = {
        topic: 'test',
        gapScore: 0.8,
        exampleQuestions: [],
        relatedTopics: []
      };
      
      // @ts-ignore - accessing private method for testing
      expect(service.determineContentType(highScoreGap, null, ['article', 'guide'])).toBe('guide');
      
      // Technical topic should be tutorial
      const technicalGap = {
        topic: 'setup',
        gapScore: 0.5,
        exampleQuestions: [],
        relatedTopics: []
      };
      
      // @ts-ignore - accessing private method for testing
      expect(service.determineContentType(technicalGap, null, ['article', 'tutorial'])).toBe('tutorial');
    });

    it('should generate appropriate titles', () => {
      const topic = 'subscription';
      const relatedTopics = ['pricing', 'plan'];
      
      // @ts-ignore - accessing private method for testing
      const articleTitle = service.generateTitle(topic, relatedTopics, 'article');
      expect(articleTitle).toContain(topic);
      
      // @ts-ignore - accessing private method for testing
      const videoTitle = service.generateTitle(topic, relatedTopics, 'video');
      expect(videoTitle).toContain(topic);
      
      // @ts-ignore - accessing private method for testing
      const faqTitle = service.generateTitle(topic, relatedTopics, 'FAQ');
      expect(faqTitle).toContain(topic);
    });

    it('should calculate priority correctly', () => {
      // @ts-ignore - accessing private method for testing
      const highPriority = service.calculatePriority(0.8, 100);
      // @ts-ignore - accessing private method for testing
      const lowPriority = service.calculatePriority(0.2, 10);
      
      expect(highPriority).toBeGreaterThan(lowPriority);
    });

    it('should generate appropriate outlines', () => {
      const topic = 'subscription';
      const relatedTopics = ['pricing', 'plan'];
      const suggestedContentAreas = ['area1', 'area2'];
      
      // @ts-ignore - accessing private method for testing
      const articleOutline = service.generateSuggestedOutline(topic, relatedTopics, suggestedContentAreas, 'article');
      expect(articleOutline).toContain('Introduction to subscription');
      expect(articleOutline).toContain('area1');
      expect(articleOutline).toContain('area2');
      expect(articleOutline).toContain('Best practices for subscription');
      
      // @ts-ignore - accessing private method for testing
      const faqOutline = service.generateSuggestedOutline(topic, relatedTopics, suggestedContentAreas, 'FAQ');
      expect(faqOutline).toContain('Common questions about subscription');
    });
  });
}); 