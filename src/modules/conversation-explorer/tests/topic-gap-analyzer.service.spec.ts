import { Test, TestingModule } from '@nestjs/testing';
import { TopicGapAnalyzerService } from '../services/topic-gap-analyzer.service';
import { Logger } from '@nestjs/common';

describe('TopicGapAnalyzerService', () => {
  let service: TopicGapAnalyzerService;
  let mockConversationRepo: any;
  let mockCacheService: any;

  beforeEach(async () => {
    // Create mock conversation repository
    mockConversationRepo = {
      findByBrandId: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve([
          {
            id: '1',
            brandId,
            createdAt: new Date('2023-01-01T10:00:00Z'),
            messages: [
              { role: 'user', content: 'How do I change my subscription plan?', timestamp: new Date('2023-01-01T10:00:00Z') },
              { role: 'assistant', content: 'You can change your subscription plan in account settings.', timestamp: new Date('2023-01-01T10:01:00Z') },
              { role: 'user', content: 'What are the pricing options?', timestamp: new Date('2023-01-01T10:02:00Z') },
              { role: 'assistant', content: 'We have Basic, Pro, and Enterprise plans.', timestamp: new Date('2023-01-01T10:03:00Z') },
            ]
          },
          {
            id: '2',
            brandId,
            createdAt: new Date('2023-01-05T14:00:00Z'),
            messages: [
              { role: 'user', content: 'I need to update my subscription plan', timestamp: new Date('2023-01-05T14:00:00Z') },
              { role: 'assistant', content: 'I can help you with that.', timestamp: new Date('2023-01-05T14:01:00Z') },
            ]
          },
          {
            id: '3',
            brandId,
            createdAt: new Date('2023-01-10T09:00:00Z'),
            messages: [
              { role: 'user', content: 'How much does the premium plan cost?', timestamp: new Date('2023-01-10T09:00:00Z') },
              // No assistant response - this should be detected as an unanswered question
            ]
          },
          {
            id: '4',
            brandId,
            createdAt: new Date('2023-01-15T16:00:00Z'),
            messages: [
              { role: 'user', content: 'Can I get a discount on the subscription?', timestamp: new Date('2023-01-15T16:00:00Z') },
              // No assistant response - this should be detected as an unanswered question
            ]
          },
          {
            id: '5',
            brandId,
            createdAt: new Date('2023-01-20T11:00:00Z'),
            messages: [
              { role: 'user', content: 'How do I cancel my subscription?', timestamp: new Date('2023-01-20T11:00:00Z') },
              { role: 'assistant', content: 'You can cancel your subscription in account settings.', timestamp: new Date('2023-01-20T11:01:00Z') },
            ]
          }
        ]);
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
        TopicGapAnalyzerService,
        {
          provide: 'ConversationRepository',
          useValue: mockConversationRepo
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

    service = module.get<TopicGapAnalyzerService>(TopicGapAnalyzerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeTopicGaps', () => {
    it('should use cache service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.analyzeTopicGaps(brandId, options);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should return topic gap analysis results', async () => {
      const brandId = 'test-brand';
      const result = await service.analyzeTopicGaps(brandId);

      expect(result).toBeDefined();
      expect(result.gaps).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.totalTopicsAnalyzed).toBeDefined();
      expect(result.totalConversationsAnalyzed).toBeDefined();
    });

    it('should fetch conversations from repository', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.analyzeTopicGaps(brandId, options);

      expect(mockConversationRepo.findByBrandId).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              $gte: options.startDate,
              $lte: options.endDate
            })
          })
        })
      );
    });

    it('should identify gaps in content coverage', async () => {
      const brandId = 'test-brand';
      const result = await service.analyzeTopicGaps(brandId);

      // There should be at least one gap
      expect(result.gaps.length).toBeGreaterThan(0);
      
      // Check if the gaps have the expected properties
      const gap = result.gaps[0];
      expect(gap.topic).toBeDefined();
      expect(gap.gapScore).toBeGreaterThan(0);
      expect(gap.relatedTopics).toBeDefined();
      expect(gap.frequency).toBeGreaterThan(0);
      expect(gap.exampleQuestions).toBeDefined();
      expect(gap.suggestedContentAreas).toBeDefined();
    });

    it('should respect minFrequency option', async () => {
      const brandId = 'test-brand';
      
      // With high minFrequency, should return fewer gaps
      const resultWithHighFreq = await service.analyzeTopicGaps(brandId, { minFrequency: 100 });
      
      // With low minFrequency, should return more gaps
      const resultWithLowFreq = await service.analyzeTopicGaps(brandId, { minFrequency: 1 });
      
      // The high frequency result should have fewer gaps
      expect(resultWithHighFreq.gaps.length).toBeLessThanOrEqual(resultWithLowFreq.gaps.length);
    });

    it('should respect minGapScore option', async () => {
      const brandId = 'test-brand';
      
      // With high minGapScore, should return fewer gaps
      const resultWithHighScore = await service.analyzeTopicGaps(brandId, { minGapScore: 0.9 });
      
      // With low minGapScore, should return more gaps
      const resultWithLowScore = await service.analyzeTopicGaps(brandId, { minGapScore: 0.1 });
      
      // The high score result should have fewer gaps
      expect(resultWithHighScore.gaps.length).toBeLessThanOrEqual(resultWithLowScore.gaps.length);
    });
  });

  describe('private methods', () => {
    it('should detect questions correctly', () => {
      // @ts-ignore - accessing private method for testing
      expect(service.isQuestion('How do I change my plan?')).toBe(true);
      // @ts-ignore - accessing private method for testing
      expect(service.isQuestion('What is the price?')).toBe(true);
      // @ts-ignore - accessing private method for testing
      expect(service.isQuestion('This is not a question')).toBe(false);
    });

    it('should extract topics from a message', () => {
      // @ts-ignore - accessing private method for testing
      const topics = service.extractTopicsFromMessage('How do I change my subscription plan?');

      expect(topics).toContain('subscription');
      expect(topics).toContain('plan');
      expect(topics).toContain('change');
    });

    it('should calculate topic frequencies correctly', () => {
      const topics = [
        { topic: 'subscription', conversationId: '1', messageId: '1', isAnswered: true },
        { topic: 'subscription', conversationId: '2', messageId: '2', isAnswered: true },
        { topic: 'plan', conversationId: '3', messageId: '3', isAnswered: false }
      ];

      // @ts-ignore - accessing private method for testing
      const frequencies = service.calculateTopicFrequencies(topics);

      expect(frequencies['subscription']).toBe(2);
      expect(frequencies['plan']).toBe(1);
    });

    it('should calculate topic satisfaction scores correctly', () => {
      const topics = [
        { topic: 'subscription', conversationId: '1', messageId: '1', isAnswered: true },
        { topic: 'subscription', conversationId: '2', messageId: '2', isAnswered: false },
        { topic: 'plan', conversationId: '3', messageId: '3', isAnswered: true }
      ];

      const questions = [
        { question: 'How do I change my subscription?', topics: ['subscription', 'change'], conversationId: '1', messageId: '1', isAnswered: true },
        { question: 'What about my subscription?', topics: ['subscription'], conversationId: '2', messageId: '2', isAnswered: false },
        { question: 'Tell me about the plan', topics: ['plan'], conversationId: '3', messageId: '3', isAnswered: true }
      ];

      // @ts-ignore - accessing private method for testing
      const scores = service.calculateTopicSatisfactionScores(topics, questions);

      // Subscription: 1 answered out of 2 questions = 0.5
      expect(scores['subscription']).toBe(0.5);
      
      // Plan: 1 answered out of 1 question = 1.0
      expect(scores['plan']).toBe(1.0);
    });
  });
}); 