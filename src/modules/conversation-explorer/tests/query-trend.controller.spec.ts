import { Test, TestingModule } from '@nestjs/testing';
import { QueryTrendController } from '../controllers/query-trend.controller';
import { QueryTrendAnalysisService } from '../services/query-trend-analysis.service';
import { Logger } from '@nestjs/common';

describe('QueryTrendController', () => {
  let controller: QueryTrendController;
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
      controllers: [QueryTrendController],
      providers: [
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

    controller = module.get<QueryTrendController>(QueryTrendController);
    service = module.get<QueryTrendAnalysisService>(QueryTrendAnalysisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyzeQueryTrends', () => {
    it('should call service with correct parameters', async () => {
      const analyzeDto = {
        brandId: 'test-brand',
        options: {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-31T23:59:59Z',
          minFrequency: 3,
          minGrowthRate: 10,
          limit: 5
        }
      };

      await controller.analyzeQueryTrends(analyzeDto);

      expect(service.analyzeQueryTrends).toHaveBeenCalledWith(
        'test-brand',
        {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minFrequency: 3,
          minGrowthRate: 10,
          limit: 5
        }
      );
    });

    it('should convert Date objects to ISO strings in response', async () => {
      const analyzeDto = {
        brandId: 'test-brand'
      };

      const result = await controller.analyzeQueryTrends(analyzeDto);

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
  });

  describe('getQueryTrends', () => {
    it('should call service with correct parameters', async () => {
      const brandId = 'test-brand';
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-01-31T23:59:59Z';
      const minFrequency = 3;
      const minGrowthRate = 10;
      const limit = 5;

      await controller.getQueryTrends(
        brandId,
        startDate,
        endDate,
        minFrequency,
        minGrowthRate,
        limit
      );

      expect(service.analyzeQueryTrends).toHaveBeenCalledWith(
        'test-brand',
        {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minFrequency: 3,
          minGrowthRate: 10,
          limit: 5
        }
      );
    });

    it('should handle missing optional parameters', async () => {
      const brandId = 'test-brand';

      await controller.getQueryTrends(brandId);

      expect(service.analyzeQueryTrends).toHaveBeenCalledWith(
        'test-brand',
        {
          startDate: undefined,
          endDate: undefined,
          minFrequency: undefined,
          minGrowthRate: undefined,
          limit: undefined
        }
      );
    });

    it('should convert Date objects to ISO strings in response', async () => {
      const brandId = 'test-brand';

      const result = await controller.getQueryTrends(brandId);

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
  });
}); 