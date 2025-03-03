import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import {
  AnswerScore,
  ScoreMetricType,
} from '../../entities/answer-score.entity';
import { Answer } from '../../entities/answer.entity';

describe('AnswerScoringService', () => {
  let service: AnswerScoringService;
  let scoreRepository: jest.Mocked<Repository<AnswerScore>>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mock implementations
    const mockScoreRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerScoringService,
        {
          provide: getRepositoryToken(AnswerScore),
          useValue: mockScoreRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AnswerScoringService>(AnswerScoringService);
    scoreRepository = module.get(
      getRepositoryToken(AnswerScore),
    ) as jest.Mocked<Repository<AnswerScore>>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Set up default mock behavior
    configService.get.mockImplementation((key, defaultValue) => {
      if (key === 'SCORE_WEIGHT_RELEVANCE') return 0.4;
      if (key === 'SCORE_WEIGHT_ACCURACY') return 0.4;
      if (key === 'SCORE_WEIGHT_COMPLETENESS') return 0.2;
      return defaultValue;
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('scoreAnswer', () => {
    it('should calculate scores for all metrics', async () => {
      // Arrange
      const content =
        'This is a test answer that contains relevant information about the query.';
      const query = 'What is a test?';

      // Mock the scoring methods
      jest
        .spyOn(service as any, 'calculateRelevanceScore')
        .mockResolvedValue(0.8);
      jest
        .spyOn(service as any, 'calculateAccuracyScore')
        .mockResolvedValue(0.7);
      jest
        .spyOn(service as any, 'calculateCompletenessScore')
        .mockResolvedValue(0.6);

      // Act
      const result = await service.scoreAnswer(content, query);

      // Assert
      expect(result).toEqual({
        relevance: 0.8,
        accuracy: 0.7,
        completeness: 0.6,
        overall: 0.72, // (0.8 * 0.4) + (0.7 * 0.4) + (0.6 * 0.2)
      });
      expect(service['calculateRelevanceScore']).toHaveBeenCalledWith(
        content,
        query,
      );
      expect(service['calculateAccuracyScore']).toHaveBeenCalledWith(content);
      expect(service['calculateCompletenessScore']).toHaveBeenCalledWith(
        content,
        query,
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const content = 'This is a test answer.';
      const query = 'What is a test?';

      // Mock an error
      jest
        .spyOn(service as any, 'calculateRelevanceScore')
        .mockImplementation(() => {
          throw new Error('Test error');
        });

      // Act
      const result = await service.scoreAnswer(content, query);

      // Assert
      expect(result).toEqual({
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        overall: 0,
      });
    });
  });

  describe('scoreAndSaveAnswer', () => {
    it('should score and save all metrics', async () => {
      // Arrange
      const mockAnswer = {
        id: '123',
        queryId: '456',
        content: 'This is a test answer.',
        provider: 'test-provider',
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
        metadata: [],
        validations: [],
        scores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      const answer = mockAnswer as unknown as Answer;
      const queryText = 'What is a test?';

      const scores = {
        relevance: 0.8,
        accuracy: 0.7,
        completeness: 0.6,
        overall: 0.72,
      };

      // Mock the scoreAnswer method
      jest.spyOn(service, 'scoreAnswer').mockResolvedValue(scores);

      // Mock the repository methods
      const mockRelevanceScore = {
        id: '1',
        answerId: answer.id,
        metricType: ScoreMetricType.RELEVANCE,
      };
      const mockAccuracyScore = {
        id: '2',
        answerId: answer.id,
        metricType: ScoreMetricType.ACCURACY,
      };
      const mockCompletenessScore = {
        id: '3',
        answerId: answer.id,
        metricType: ScoreMetricType.COMPLETENESS,
      };
      const mockOverallScore = {
        id: '4',
        answerId: answer.id,
        metricType: ScoreMetricType.OVERALL,
      };

      scoreRepository.create.mockImplementation(data => {
        if (data.metricType === ScoreMetricType.RELEVANCE)
          return mockRelevanceScore as any;
        if (data.metricType === ScoreMetricType.ACCURACY)
          return mockAccuracyScore as any;
        if (data.metricType === ScoreMetricType.COMPLETENESS)
          return mockCompletenessScore as any;
        if (data.metricType === ScoreMetricType.OVERALL)
          return mockOverallScore as any;
        return {} as any;
      });

      scoreRepository.save.mockImplementation(data =>
        Promise.resolve(data as any),
      );

      // Act
      const result = await service.scoreAndSaveAnswer(answer, queryText);

      // Assert
      expect(result).toBe(answer);
      expect(result.relevanceScore).toBe(scores.relevance);
      expect(result.accuracyScore).toBe(scores.accuracy);
      expect(result.completenessScore).toBe(scores.completeness);
      expect(result.overallScore).toBe(scores.overall);

      expect(service.scoreAnswer).toHaveBeenCalledWith(
        answer.content,
        queryText,
      );
      expect(scoreRepository.create).toHaveBeenCalledTimes(4);
      expect(scoreRepository.save).toHaveBeenCalledTimes(4);

      // Verify the create calls for each metric
      expect(scoreRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          metricType: ScoreMetricType.RELEVANCE,
          score: scores.relevance,
        }),
      );

      expect(scoreRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          metricType: ScoreMetricType.ACCURACY,
          score: scores.accuracy,
        }),
      );

      expect(scoreRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          metricType: ScoreMetricType.COMPLETENESS,
          score: scores.completeness,
        }),
      );

      expect(scoreRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          metricType: ScoreMetricType.OVERALL,
          score: scores.overall,
        }),
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const mockAnswer = {
        id: '123',
        queryId: '456',
        content: 'This is a test answer.',
        provider: 'test-provider',
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
        metadata: [],
        validations: [],
        scores: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: undefined,
      };

      const answer = mockAnswer as unknown as Answer;
      const queryText = 'What is a test?';

      // Mock an error
      const error = new Error('Test error');
      jest.spyOn(service, 'scoreAnswer').mockRejectedValue(error);

      // Act & Assert
      await expect(
        service.scoreAndSaveAnswer(answer, queryText),
      ).rejects.toThrow(error);
    });
  });

  describe('calculateRelevanceScore', () => {
    it('should calculate relevance score based on query term matching', async () => {
      // This is testing a private method, so we need to access it through the service instance
      const content = 'This is a test answer about testing.';
      const query = 'What is testing?';

      // Act
      const result = await (service as any).calculateRelevanceScore(
        content,
        query,
      );

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateAccuracyScore', () => {
    it('should calculate accuracy score', async () => {
      // This is testing a private method, so we need to access it through the service instance
      const content = 'This is a test answer.';

      // Act
      const result = await (service as any).calculateAccuracyScore(content);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateCompletenessScore', () => {
    it('should calculate completeness score based on length and structure', async () => {
      // This is testing a private method, so we need to access it through the service instance
      const content =
        'This is a test answer.\n\nIt has multiple paragraphs.\n\nAnd is reasonably long.';
      const query = 'What is a test?';

      // Act
      const result = await (service as any).calculateCompletenessScore(
        content,
        query,
      );

      // Assert
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
