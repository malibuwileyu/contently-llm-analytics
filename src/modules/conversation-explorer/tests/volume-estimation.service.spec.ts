import { Test, TestingModule } from '@nestjs/testing';
import { VolumeEstimationService } from '../services/volume-estimation.service';
import { Logger } from '@nestjs/common';

describe('VolumeEstimationService', () => {
  let service: VolumeEstimationService;
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
              { role: 'assistant', content: 'The premium plan costs $29.99 per month.', timestamp: new Date('2023-01-10T09:01:00Z') },
            ]
          },
          {
            id: '4',
            brandId,
            createdAt: new Date('2023-01-15T16:00:00Z'),
            messages: [
              { role: 'user', content: 'Can I get a discount on the subscription?', timestamp: new Date('2023-01-15T16:00:00Z') },
              { role: 'assistant', content: 'We offer discounts for annual subscriptions.', timestamp: new Date('2023-01-15T16:01:00Z') },
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
        VolumeEstimationService,
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

    service = module.get<VolumeEstimationService>(VolumeEstimationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('estimateVolume', () => {
    it('should use cache service', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.estimateVolume(brandId, options);

      expect(mockCacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should return volume estimation results', async () => {
      const brandId = 'test-brand';
      const result = await service.estimateVolume(brandId);

      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.byDay).toBeDefined();
      expect(result.byWeek).toBeDefined();
      expect(result.byMonth).toBeDefined();
      expect(result.period).toBeDefined();
    });

    it('should fetch conversations from repository', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31')
      };

      await service.estimateVolume(brandId, options);

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

    it('should calculate correct metrics', async () => {
      const brandId = 'test-brand';
      const result = await service.estimateVolume(brandId);

      // 5 conversations in the mock data
      expect(result.metrics.totalConversations).toBe(5);
      
      // 12 messages in total (4 + 2 + 2 + 2 + 2)
      expect(result.metrics.totalMessages).toBe(12);
      
      // Average messages per conversation: 12 / 5 = 2.4
      expect(result.metrics.avgMessagesPerConversation).toBe(2.4);
      
      // 6 user messages in total
      expect(result.metrics.avgUserMessagesPerConversation).toBe(1.2);
      
      // 6 assistant messages in total
      expect(result.metrics.avgAssistantMessagesPerConversation).toBe(1.2);
    });

    it('should respect includeDaily option', async () => {
      const brandId = 'test-brand';
      
      // With includeDaily = false
      const resultWithoutDaily = await service.estimateVolume(brandId, { includeDaily: false });
      expect(resultWithoutDaily.byDay).toHaveLength(0);
      
      // With includeDaily = true
      const resultWithDaily = await service.estimateVolume(brandId, { includeDaily: true });
      expect(resultWithDaily.byDay.length).toBeGreaterThan(0);
    });

    it('should respect includeWeekly option', async () => {
      const brandId = 'test-brand';
      
      // With includeWeekly = false
      const resultWithoutWeekly = await service.estimateVolume(brandId, { includeWeekly: false });
      expect(resultWithoutWeekly.byWeek).toHaveLength(0);
      
      // With includeWeekly = true
      const resultWithWeekly = await service.estimateVolume(brandId, { includeWeekly: true });
      expect(resultWithWeekly.byWeek.length).toBeGreaterThan(0);
    });

    it('should respect includeMonthly option', async () => {
      const brandId = 'test-brand';
      
      // With includeMonthly = false
      const resultWithoutMonthly = await service.estimateVolume(brandId, { includeMonthly: false });
      expect(resultWithoutMonthly.byMonth).toHaveLength(0);
      
      // With includeMonthly = true
      const resultWithMonthly = await service.estimateVolume(brandId, { includeMonthly: true });
      expect(resultWithMonthly.byMonth.length).toBeGreaterThan(0);
    });
  });

  describe('private methods', () => {
    it('should calculate overall metrics correctly', () => {
      const conversations = [
        {
          messages: [
            { role: 'user', content: 'Hello', timestamp: new Date('2023-01-01T10:00:00Z') },
            { role: 'assistant', content: 'Hi there', timestamp: new Date('2023-01-01T10:01:00Z') }
          ]
        },
        {
          messages: [
            { role: 'user', content: 'Help me', timestamp: new Date('2023-01-02T10:00:00Z') },
            { role: 'assistant', content: 'Sure', timestamp: new Date('2023-01-02T10:01:00Z') },
            { role: 'user', content: 'Thanks', timestamp: new Date('2023-01-02T10:02:00Z') }
          ]
        }
      ];

      // @ts-ignore - accessing private method for testing
      const metrics = service.calculateOverallMetrics(conversations);

      expect(metrics.totalConversations).toBe(2);
      expect(metrics.totalMessages).toBe(5);
      expect(metrics.avgMessagesPerConversation).toBe(2.5);
      expect(metrics.avgUserMessagesPerConversation).toBe(1.5);
      expect(metrics.avgAssistantMessagesPerConversation).toBe(1);
    });

    it('should calculate volume by day correctly', () => {
      const conversations = [
        {
          createdAt: new Date('2023-01-01T10:00:00Z'),
          messages: [
            { role: 'user', content: 'Hello', timestamp: new Date('2023-01-01T10:00:00Z') },
            { role: 'assistant', content: 'Hi there', timestamp: new Date('2023-01-01T10:01:00Z') }
          ]
        },
        {
          createdAt: new Date('2023-01-01T14:00:00Z'),
          messages: [
            { role: 'user', content: 'Help me', timestamp: new Date('2023-01-01T14:00:00Z') },
            { role: 'assistant', content: 'Sure', timestamp: new Date('2023-01-01T14:01:00Z') }
          ]
        },
        {
          createdAt: new Date('2023-01-02T10:00:00Z'),
          messages: [
            { role: 'user', content: 'Another day', timestamp: new Date('2023-01-02T10:00:00Z') },
            { role: 'assistant', content: 'Yes', timestamp: new Date('2023-01-02T10:01:00Z') }
          ]
        }
      ];

      // @ts-ignore - accessing private method for testing
      const byDay = service.calculateVolumeByDay(conversations);

      expect(byDay).toHaveLength(2); // Two days
      
      // First day: 2023-01-01
      expect(byDay[0].period).toBe('2023-01-01');
      expect(byDay[0].conversationCount).toBe(2);
      expect(byDay[0].messageCount).toBe(4);
      expect(byDay[0].userMessageCount).toBe(2);
      expect(byDay[0].assistantMessageCount).toBe(2);
      
      // Second day: 2023-01-02
      expect(byDay[1].period).toBe('2023-01-02');
      expect(byDay[1].conversationCount).toBe(1);
      expect(byDay[1].messageCount).toBe(2);
      expect(byDay[1].userMessageCount).toBe(1);
      expect(byDay[1].assistantMessageCount).toBe(1);
    });
  });
}); 