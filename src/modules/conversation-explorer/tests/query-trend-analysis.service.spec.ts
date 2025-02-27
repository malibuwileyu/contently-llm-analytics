import { Test, TestingModule } from '@nestjs/testing';
import { QueryTrendAnalysisService } from '../services/query-trend-analysis.service';
import { Logger } from '@nestjs/common';

describe('QueryTrendAnalysisService', () => {
  let service: QueryTrendAnalysisService;
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
            messages: [
              { role: 'user', content: 'How do I change my subscription plan?', timestamp: new Date('2023-01-01T10:00:00Z') },
              { role: 'assistant', content: 'You can change your subscription plan in account settings.', timestamp: new Date('2023-01-01T10:01:00Z') },
              { role: 'user', content: 'What are the pricing options?', timestamp: new Date('2023-01-01T10:02:00Z') },
            ],
            analyzedAt: new Date('2023-01-01T10:05:00Z')
          },
          {
            id: '2',
            brandId,
            messages: [
              { role: 'user', content: 'I need to update my subscription plan', timestamp: new Date('2023-01-05T14:00:00Z') },
              { role: 'assistant', content: 'I can help you with that.', timestamp: new Date('2023-01-05T14:01:00Z') },
            ],
            analyzedAt: new Date('2023-01-05T14:05:00Z')
          },
          {
            id: '3',
            brandId,
            messages: [
              { role: 'user', content: 'How much does the premium plan cost?', timestamp: new Date('2023-01-10T09:00:00Z') },
              { role: 'assistant', content: 'The premium plan costs $29.99 per month.', timestamp: new Date('2023-01-10T09:01:00Z') },
            ],
            analyzedAt: new Date('2023-01-10T09:05:00Z')
          },
          {
            id: '4',
            brandId,
            messages: [
              { role: 'user', content: 'Can I get a discount on the subscription?', timestamp: new Date('2023-01-15T16:00:00Z') },
              { role: 'assistant', content: 'We offer discounts for annual subscriptions.', timestamp: new Date('2023-01-15T16:01:00Z') },
            ],
            analyzedAt: new Date('2023-01-15T16:05:00Z')
          },
          {
            id: '5',
            brandId,
            messages: [
              { role: 'user', content: 'How do I cancel my subscription?', timestamp: new Date('2023-01-20T11:00:00Z') },
              { role: 'assistant', content: 'You can cancel your subscription in account settings.', timestamp: new Date('2023-01-20T11:01:00Z') },
            ],
            analyzedAt: new Date('2023-01-20T11:05:00Z')
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
        QueryTrendAnalysisService,
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

    service = module.get<QueryTrendAnalysisService>(QueryTrendAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeQueryTrends', () => {
    it('should use cache service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.analyzeQueryTrends(brandId, options);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should return query trend analysis results', async () => {
      const brandId = 'test-brand';
      const result = await service.analyzeQueryTrends(brandId);

      expect(result).toBeDefined();
      expect(result.risingTrends).toBeDefined();
      expect(result.fallingTrends).toBeDefined();
      expect(result.stableTrends).toBeDefined();
      expect(result.period).toBeDefined();
    });

    it('should fetch conversations from repository', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.analyzeQueryTrends(brandId, options);

      expect(mockConversationRepo.findByBrandId).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          where: expect.objectContaining({
            analyzedAt: expect.objectContaining({
              $gte: options.startDate,
              $lte: options.endDate
            })
          })
        })
      );
    });

    it('should detect subscription-related trends', async () => {
      const brandId = 'test-brand';
      const result = await service.analyzeQueryTrends(brandId);

      // Check if subscription-related trends are detected
      const allTrends = [
        ...result.risingTrends,
        ...result.fallingTrends,
        ...result.stableTrends
      ];

      const subscriptionTrends = allTrends.filter(trend => 
        trend.pattern.includes('subscription') || 
        trend.relatedTopics.some(topic => topic.includes('subscription'))
      );

      expect(subscriptionTrends.length).toBeGreaterThan(0);
    });

    it('should detect pricing-related trends', async () => {
      const brandId = 'test-brand';
      const result = await service.analyzeQueryTrends(brandId);

      // Check if pricing-related trends are detected
      const allTrends = [
        ...result.risingTrends,
        ...result.fallingTrends,
        ...result.stableTrends
      ];

      const pricingTrends = allTrends.filter(trend => 
        trend.pattern.includes('pricing') || 
        trend.pattern.includes('cost') || 
        trend.pattern.includes('discount') ||
        trend.relatedTopics.some(topic => 
          topic.includes('pricing') || 
          topic.includes('cost') || 
          topic.includes('discount')
        )
      );

      expect(pricingTrends.length).toBeGreaterThan(0);
    });
  });

  describe('private methods', () => {
    it('should extract user queries from conversations', () => {
      // @ts-ignore - accessing private method for testing
      const queries = service.extractUserQueries([
        {
          messages: [
            { role: 'user', content: 'Test query 1', timestamp: new Date() },
            { role: 'assistant', content: 'Test response', timestamp: new Date() },
            { role: 'user', content: 'Test query 2', timestamp: new Date() }
          ]
        }
      ]);

      expect(queries).toHaveLength(2);
      expect(queries[0].query).toBe('Test query 1');
      expect(queries[1].query).toBe('Test query 2');
    });

    it('should extract key phrases from a query', () => {
      // @ts-ignore - accessing private method for testing
      const phrases = service.extractKeyPhrases('How do I change my subscription plan?');

      expect(phrases).toContain('change');
      expect(phrases).toContain('subscription');
      expect(phrases).toContain('plan');
      expect(phrases).toContain('change subscription');
      expect(phrases).toContain('subscription plan');
    });
  });
}); 