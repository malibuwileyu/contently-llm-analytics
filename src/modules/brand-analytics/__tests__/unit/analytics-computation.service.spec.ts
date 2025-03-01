import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsComputationService } from '../../services/analytics-computation.service';
import { MentionRepository } from '../../repositories/mention.repository';
import { CompetitorRepository } from '../../repositories/competitor.repository';
import { AnalyticsResultRepository } from '../../repositories/analytics-result.repository';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { AnalyticsResultEntity } from '../../entities/analytics-result.entity';
import { MentionEntity } from '../../entities/mention.entity';

describe('AnalyticsComputationService', () => {
  let service: AnalyticsComputationService;
  let mentionRepository: jest.Mocked<MentionRepository>;
  let competitorRepository: jest.Mocked<CompetitorRepository>;
  let analyticsResultRepository: jest.Mocked<AnalyticsResultRepository>;

  beforeEach(async () => {
    // Create mock repositories
    const mockMentionRepository = {
      getStatsByTimePeriod: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockCompetitorRepository = {
      findByBusinessCategory: jest.fn(),
    };

    const mockAnalyticsResultRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsComputationService,
        {
          provide: MentionRepository,
          useValue: mockMentionRepository,
        },
        {
          provide: CompetitorRepository,
          useValue: mockCompetitorRepository,
        },
        {
          provide: AnalyticsResultRepository,
          useValue: mockAnalyticsResultRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsComputationService>(
      AnalyticsComputationService,
    );
    mentionRepository = module.get(
      MentionRepository,
    ) as jest.Mocked<MentionRepository>;
    competitorRepository = module.get(
      CompetitorRepository,
    ) as jest.Mocked<CompetitorRepository>;
    analyticsResultRepository = module.get(
      AnalyticsResultRepository,
    ) as jest.Mocked<AnalyticsResultRepository>;

    // Setup mock query builder
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    };
    mentionRepository.createQueryBuilder.mockReturnValue(
      mockQueryBuilder as any,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('computeMentionFrequency', () => {
    it('should compute mention frequency correctly', async () => {
      // Arrange
      const businessCategoryId = 'category1';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const timeFrame = 'monthly';

      const mockCompetitors = [
        createMockCompetitor('comp1', 'Nike', true),
        createMockCompetitor('comp2', 'Adidas', false),
        createMockCompetitor('comp3', 'Puma', false),
      ];

      const mockMentionStats = {
        comp1: 50,
        comp2: 30,
        comp3: 20,
      };

      competitorRepository.findByBusinessCategory.mockResolvedValue(
        mockCompetitors,
      );
      mentionRepository.getStatsByTimePeriod.mockResolvedValue(
        mockMentionStats,
      );
      analyticsResultRepository.save.mockResolvedValue([] as any);

      // Act
      const results = await service.computeMentionFrequency(
        businessCategoryId,
        startDate,
        endDate,
        timeFrame,
      );

      // Assert
      expect(results.length).toBe(3);

      // Check Nike (_customer) result
      const nikeResult = results.find(r => r.competitorId === 'comp1');
      expect(nikeResult).toBeDefined();
      if (nikeResult) {
        expect(nikeResult.value).toBe(50); // 50%
        expect(nikeResult.rank).toBe(1);
      }

      // Check Adidas result
      const adidasResult = results.find(r => r.competitorId === 'comp2');
      expect(adidasResult).toBeDefined();
      if (adidasResult) {
        expect(adidasResult.value).toBe(30); // 30%
        expect(adidasResult.rank).toBe(2);
      }

      // Check Puma result
      const pumaResult = results.find(r => r.competitorId === 'comp3');
      expect(pumaResult).toBeDefined();
      if (pumaResult) {
        expect(pumaResult.value).toBe(20); // 20%
        expect(pumaResult.rank).toBe(3);
      }

      // Verify repository calls
      expect(competitorRepository.findByBusinessCategory).toHaveBeenCalledWith(
        businessCategoryId,
      );
      expect(mentionRepository.getStatsByTimePeriod).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
      expect(analyticsResultRepository.save).toHaveBeenCalled();
    });

    it('should return empty array when no competitors found', async () => {
      // Arrange
      competitorRepository.findByBusinessCategory.mockResolvedValue([]);

      // Act
      const results = await service.computeMentionFrequency(
        'category1',
        new Date(),
        new Date(),
        'monthly',
      );

      // Assert
      expect(results).toEqual([]);
      expect(mentionRepository.getStatsByTimePeriod).not.toHaveBeenCalled();
    });

    it('should return empty array when no mentions found', async () => {
      // Arrange
      const mockCompetitors = [createMockCompetitor('comp1', 'Nike', true)];
      competitorRepository.findByBusinessCategory.mockResolvedValue(
        mockCompetitors,
      );
      mentionRepository.getStatsByTimePeriod.mockResolvedValue({});

      // Act
      const results = await service.computeMentionFrequency(
        'category1',
        new Date(),
        new Date(),
        'monthly',
      );

      // Assert
      expect(results).toEqual([]);
      expect(analyticsResultRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('computeSentimentAnalytics', () => {
    it('should compute sentiment analytics correctly', async () => {
      // Arrange
      const businessCategoryId = 'category1';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const timeFrame = 'monthly';

      const mockCompetitors = [
        createMockCompetitor('comp1', 'Nike', true),
        createMockCompetitor('comp2', 'Adidas', false),
      ];

      const mockNikeMentions = [
        createMockMentionWithSentiment('m1', 'comp1', 0.8, 'positive'),
        createMockMentionWithSentiment('m2', 'comp1', 0.6, 'positive'),
        createMockMentionWithSentiment('m3', 'comp1', -0.2, 'negative'),
      ];

      const mockAdidasMentions = [
        createMockMentionWithSentiment('m4', 'comp2', 0.3, 'positive'),
        createMockMentionWithSentiment('m5', 'comp2', -0.5, 'negative'),
      ];

      competitorRepository.findByBusinessCategory.mockResolvedValue(
        mockCompetitors,
      );

      const mockQueryBuilder = mentionRepository.createQueryBuilder();
      (mockQueryBuilder.getMany as jest.Mock)
        .mockResolvedValueOnce(mockNikeMentions)
        .mockResolvedValueOnce(mockAdidasMentions);

      analyticsResultRepository.save.mockResolvedValue([] as any);

      // Act
      const results = await service.computeSentimentAnalytics(
        businessCategoryId,
        startDate,
        endDate,
        timeFrame,
      );

      // Assert
      expect(results.length).toBe(2);

      // Check Nike result
      const nikeResult = results.find(r => r.competitorId === 'comp1');
      expect(nikeResult).toBeDefined();
      if (nikeResult) {
        expect(nikeResult.value).toBeCloseTo(0.4); // Average of 0.8, 0.6, -0.2
        expect(nikeResult.totalMentions).toBe(3);
        expect(
          nikeResult.additionalData.sentimentDistribution.positive,
        ).toBeCloseTo(66.67);
        expect(
          nikeResult.additionalData.sentimentDistribution.negative,
        ).toBeCloseTo(33.33);
      }

      // Check Adidas result
      const adidasResult = results.find(r => r.competitorId === 'comp2');
      expect(adidasResult).toBeDefined();
      if (adidasResult) {
        expect(adidasResult.value).toBeCloseTo(-0.1); // Average of 0.3, -0.5
        expect(adidasResult.totalMentions).toBe(2);
        expect(
          adidasResult.additionalData.sentimentDistribution.positive,
        ).toBeCloseTo(50);
        expect(
          adidasResult.additionalData.sentimentDistribution.negative,
        ).toBeCloseTo(50);
      }

      // Verify repository calls
      expect(competitorRepository.findByBusinessCategory).toHaveBeenCalledWith(
        businessCategoryId,
      );
      expect(mentionRepository.createQueryBuilder).toHaveBeenCalledTimes(3);
      expect(analyticsResultRepository.save).toHaveBeenCalled();
    });
  });
});

// Helper functions to create test data
function createMockCompetitor(
  id: string,
  name: string,
  isCustomer: boolean,
): CompetitorEntity {
  const competitor = new CompetitorEntity();
  competitor.id = id;
  competitor.name = name;
  competitor.isCustomer = isCustomer;
  return competitor;
}

function createMockMentionWithSentiment(
  id: string,
  competitorId: string,
  sentimentScore: number,
  sentimentLabel: string,
): MentionEntity {
  const mention = new MentionEntity();
  mention.id = id;
  mention.competitorId = competitorId;
  mention.sentimentScore = sentimentScore;
  mention.sentimentLabel = sentimentLabel;
  return mention;
}
