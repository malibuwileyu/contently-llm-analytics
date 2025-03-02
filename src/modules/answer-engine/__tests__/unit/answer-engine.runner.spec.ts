import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnswerEngineRunner } from '../../runners/answer-engine.runner';
import { FeatureContext } from '../../../../shared/runners/feature-runner.interface';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMention } from '../../entities/brand-mention.entity';
import { BrandHealth } from '../../interfaces/sentiment-analysis.interface';

describe('AnswerEngineRunner', () => {
  let runner: AnswerEngineRunner;
  let answerEngineService: Partial<AnswerEngineService>;
  let configService: Partial<ConfigService>;

  beforeEach(async () => {
    // Create mocks
    answerEngineService = {
      analyzeMention: jest.fn(),
      getBrandHealth: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerEngineRunner,
        {
          provide: AnswerEngineService,
          useValue: answerEngineService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    runner = module.get<AnswerEngineRunner>(AnswerEngineRunner);
  });

  it('should be defined', () => {
    expect(runner).toBeDefined();
  });

  describe('getName', () => {
    it('should return the correct name', () => {
      expect(runner.getName()).toBe('answer-engine');
    });
  });

  describe('isEnabled', () => {
    it('should return true when feature is enabled', async () => {
      // Arrange
      (configService.get as jest.Mock).mockReturnValue(true);

      // Act
      const result = await runner.isEnabled();

      // Assert
      expect(result).toBe(true);
      expect(configService.get).toHaveBeenCalledWith(
        'features.answerEngine.enabled',
        true,
      );
    });

    it('should return false when feature is disabled', async () => {
      // Arrange
      (configService.get as jest.Mock).mockReturnValue(false);

      // Act
      const result = await runner.isEnabled();

      // Assert
      expect(result).toBe(false);
      expect(configService.get).toHaveBeenCalledWith(
        'features.answerEngine.enabled',
        true,
      );
    });
  });

  describe('run', () => {
    it('should analyze mention and get brand health', async () => {
      // Arrange
      const context: FeatureContext = {
        brandId: 'brand-123',
        metadata: {
          content: 'This is a test content',
          context: {
            query: 'test query',
            response: 'test response',
            platform: 'test platform',
          },
          citations: [{ source: 'https://example.com', metadata: { page: 1 } }],
        },
      };

      const mention = { id: 'mention-123' } as BrandMention;
      const health: BrandHealth = {
        overallSentiment: 0.7,
        trend: [],
        mentionCount: 1,
      };

      (answerEngineService.analyzeMention as jest.Mock).mockResolvedValue(
        mention,
      );
      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue(
        health,
      );

      // Act
      const result = await runner.run(context);

      // Assert
      expect(result).toEqual({
        success: true,
        data: {
          mention,
          health,
        },
      });

      expect(answerEngineService.analyzeMention).toHaveBeenCalledWith({
        brandId: context.brandId,
        content: context.metadata?.content,
        context: context.metadata?.context,
        citations: context.metadata?.citations,
      });

      expect(answerEngineService.getBrandHealth).toHaveBeenCalledWith(
        context.brandId,
      );
    });

    it('should handle errors during execution', async () => {
      // Arrange
      const context: FeatureContext = {
        brandId: 'brand-123',
        metadata: {
          content: 'This is a test content',
        },
      };

      const error = new Error('Test error');
      (answerEngineService.analyzeMention as jest.Mock).mockRejectedValue(
        error,
      );

      // Act
      const result = await runner.run(context);

      // Assert
      expect(result).toEqual({
        success: false,
        error: {
          message: error.message,
          code: 'ANSWER_ENGINE_ERROR',
          details: {
            brandId: context.brandId,
            timestamp: expect.any(String),
          },
        },
      });

      expect(answerEngineService.analyzeMention).toHaveBeenCalled();
      expect(answerEngineService.getBrandHealth).not.toHaveBeenCalled();
    });
  });
});
