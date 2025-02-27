import { Test, TestingModule } from '@nestjs/testing';
import { TopicClusteringService } from '../services/topic-clustering.service';
import { Logger } from '@nestjs/common';

describe('TopicClusteringService', () => {
  let service: TopicClusteringService;
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
        TopicClusteringService,
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

    service = module.get<TopicClusteringService>(TopicClusteringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clusterTopics', () => {
    it('should use cache service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.clusterTopics(brandId, options);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should return topic clustering results', async () => {
      const brandId = 'test-brand';
      const result = await service.clusterTopics(brandId);

      expect(result).toBeDefined();
      expect(result.clusters).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.totalTopics).toBeDefined();
      expect(result.totalConversations).toBeDefined();
    });

    it('should fetch conversations from repository', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.clusterTopics(brandId, options);

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

    it('should detect subscription-related clusters', async () => {
      const brandId = 'test-brand';
      const result = await service.clusterTopics(brandId);

      // Check if subscription-related clusters are detected
      const subscriptionClusters = result.clusters.filter(cluster => 
        cluster.centralTopic.includes('subscription') || 
        cluster.relatedTopics.some(topic => topic.includes('subscription'))
      );

      expect(subscriptionClusters.length).toBeGreaterThan(0);
    });

    it('should detect pricing-related clusters', async () => {
      const brandId = 'test-brand';
      const result = await service.clusterTopics(brandId);

      // Check if pricing-related clusters are detected
      const pricingClusters = result.clusters.filter(cluster => 
        cluster.centralTopic.includes('pricing') || 
        cluster.centralTopic.includes('cost') || 
        cluster.relatedTopics.some(topic => 
          topic.includes('pricing') || 
          topic.includes('cost')
        )
      );

      expect(pricingClusters.length).toBeGreaterThan(0);
    });
  });

  describe('private methods', () => {
    it('should extract topics from conversations', () => {
      // @ts-ignore - accessing private method for testing
      const topics = service.extractTopics([
        {
          id: '1',
          messages: [
            { role: 'user', content: 'How do I change my subscription plan?', timestamp: new Date() },
            { role: 'assistant', content: 'You can change your subscription plan in account settings.', timestamp: new Date() },
          ]
        }
      ]);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics.some(t => t.topic === 'subscription')).toBeTruthy();
      expect(topics.some(t => t.topic === 'plan')).toBeTruthy();
    });

    it('should extract topics from a message', () => {
      // @ts-ignore - accessing private method for testing
      const topics = service.extractTopicsFromMessage('How do I change my subscription plan?');

      expect(topics).toContain('subscription');
      expect(topics).toContain('plan');
      expect(topics).toContain('change');
    });

    it('should calculate topic frequencies', () => {
      const topics = [
        { topic: 'subscription', message: 'msg1', conversationId: '1' },
        { topic: 'subscription', message: 'msg2', conversationId: '2' },
        { topic: 'plan', message: 'msg3', conversationId: '3' }
      ];

      // @ts-ignore - accessing private method for testing
      const frequencies = service.calculateTopicFrequencies(topics);

      expect(frequencies['subscription']).toBe(2);
      expect(frequencies['plan']).toBe(1);
    });
  });
}); 