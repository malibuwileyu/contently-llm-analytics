import { Test, TestingModule } from '@nestjs/testing';
import { QueryTrendResolver } from '../resolvers/query-trend.resolver';
import { QueryTrendAnalysisService } from '../services/query-trend-analysis.service';
import { Logger } from '@nestjs/common';

describe('QueryTrendResolver', () => {
  let resolver: QueryTrendResolver;
  let service: QueryTrendAnalysisService;

  beforeEach(async () => {
    // Create mock service
    const mockQueryTrendService = {
      analyzeQueryTrends: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          risingTrends: [
            {
              pattern: 'subscription plan',
              frequency: 5,
              growthRate: 25,
              firstSeen: new Date('2023-01-01T10:00:00Z'),
              lastSeen: new Date('2023-01-20T11:00:00Z'),
              relatedTopics: ['pricing', 'subscription', 'plan']
            }
          ],
          fallingTrends: [
            {
              pattern: 'cancel subscription',
              frequency: 3,
              growthRate: -15,
              firstSeen: new Date('2023-01-05T14:00:00Z'),
              lastSeen: new Date('2023-01-20T11:00:00Z'),
              relatedTopics: ['cancel', 'subscription']
            }
          ],
          stableTrends: [
            {
              pattern: 'pricing',
              frequency: 4,
              growthRate: 5,
              firstSeen: new Date('2023-01-01T10:02:00Z'),
              lastSeen: new Date('2023-01-15T16:00:00Z'),
              relatedTopics: ['cost', 'price', 'discount']
            }
          ],
          period: {
            startDate: new Date('2023-01-01T00:00:00Z'),
            endDate: new Date('2023-01-31T23:59:59Z')
          }
        });
      })
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryTrendResolver,
        {
          provide: QueryTrendAnalysisService,
          useValue: mockQueryTrendService
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

    resolver = module.get<QueryTrendResolver>(QueryTrendResolver);
    service = module.get<QueryTrendAnalysisService>(QueryTrendAnalysisService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getQueryTrends', () => {
    it('should call service with correct parameters', async () => {
      const brandId = 'test-brand';
      const options = {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T23:59:59Z',
        minFrequency: 3,
        minGrowthRate: 10,
        limit: 5
      };

      await resolver.getQueryTrends(brandId, options);

      expect(service.analyzeQueryTrends).toHaveBeenCalledWith(
        'test-brand',
        {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minFrequency: 3,
          limit: 5
        }
      );
    });

    it('should handle missing options parameter', async () => {
      const brandId = 'test-brand';

      await resolver.getQueryTrends(brandId);

      expect(service.analyzeQueryTrends).toHaveBeenCalledWith(
        'test-brand',
        undefined
      );
    });

    it('should convert Date objects to ISO strings in response', async () => {
      const brandId = 'test-brand';

      const result = await resolver.getQueryTrends(brandId);

      // Check if dates are ISO strings
      expect(typeof result.risingTrends[0].firstSeen).toBe('string');
      expect(typeof result.risingTrends[0].lastSeen).toBe('string');
      expect(typeof result.fallingTrends[0].firstSeen).toBe('string');
      expect(typeof result.fallingTrends[0].lastSeen).toBe('string');
      expect(typeof result.stableTrends[0].firstSeen).toBe('string');
      expect(typeof result.stableTrends[0].lastSeen).toBe('string');
      expect(typeof result.period.startDate).toBe('string');
      expect(typeof result.period.endDate).toBe('string');
    });

    it('should return the expected structure', async () => {
      const brandId = 'test-brand';

      const result = await resolver.getQueryTrends(brandId);

      expect(result).toHaveProperty('risingTrends');
      expect(result).toHaveProperty('fallingTrends');
      expect(result).toHaveProperty('stableTrends');
      expect(result).toHaveProperty('period');
      expect(result.period).toHaveProperty('startDate');
      expect(result.period).toHaveProperty('endDate');
      
      expect(result.risingTrends[0]).toHaveProperty('pattern');
      expect(result.risingTrends[0]).toHaveProperty('frequency');
      expect(result.risingTrends[0]).toHaveProperty('growthRate');
      expect(result.risingTrends[0]).toHaveProperty('firstSeen');
      expect(result.risingTrends[0]).toHaveProperty('lastSeen');
      expect(result.risingTrends[0]).toHaveProperty('relatedTopics');
    });
  });
}); 