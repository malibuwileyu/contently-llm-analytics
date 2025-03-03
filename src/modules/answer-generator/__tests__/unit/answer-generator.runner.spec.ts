import { Test, TestingModule } from '@nestjs/testing';
import { AnswerGeneratorRunner } from '../../runners/answer-generator.runner';
import { AnswerGeneratorService } from '../../services/answer-generator.service';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import { Answer } from '../../entities/answer.entity';
import { GenerateAnswerDto } from '../../dto/generate-answer.dto';
import {
  AnswerValidation,
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

describe('AnswerGeneratorRunner', () => {
  let runner: AnswerGeneratorRunner;
  let generatorService: jest.Mocked<AnswerGeneratorService>;
  let validatorService: jest.Mocked<AnswerValidatorService>;
  let scoringService: jest.Mocked<AnswerScoringService>;
  let answerRepository: jest.Mocked<Repository<Answer>>;

  beforeEach(async () => {
    // Create mock implementations
    const mockGeneratorService = {
      generateAnswer: jest.fn(),
    };

    const mockValidatorService = {
      validateAnswerWithRules: jest.fn(),
    };

    const mockScoringService = {
      scoreAndSaveAnswer: jest.fn(),
    };

    const mockAnswerRepository = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerGeneratorRunner,
        {
          provide: AnswerGeneratorService,
          useValue: mockGeneratorService,
        },
        {
          provide: AnswerValidatorService,
          useValue: mockValidatorService,
        },
        {
          provide: AnswerScoringService,
          useValue: mockScoringService,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockAnswerRepository,
        },
      ],
    }).compile();

    runner = module.get<AnswerGeneratorRunner>(AnswerGeneratorRunner);
    generatorService = module.get(
      AnswerGeneratorService,
    ) as jest.Mocked<AnswerGeneratorService>;
    validatorService = module.get(
      AnswerValidatorService,
    ) as jest.Mocked<AnswerValidatorService>;
    scoringService = module.get(
      AnswerScoringService,
    ) as jest.Mocked<AnswerScoringService>;
    answerRepository = module.get(getRepositoryToken(Answer)) as jest.Mocked<
      Repository<Answer>
    >;
  });

  it('should be defined', () => {
    expect(runner).toBeDefined();
  });

  describe('run', () => {
    it('should orchestrate the answer generation, validation, and scoring process', async () => {
      // Arrange
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: '123',
        query: 'What is a test?',
        provider: 'test-provider',
        maxTokens: 500,
        temperature: 0.7,
      };

      const mockAnswer: Partial<Answer> = {
        id: 'answer-123',
        queryId: generateAnswerDto.queryId,
        content: 'This is a test answer.',
        provider: generateAnswerDto.provider,
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
      };

      const validatedAnswer: Partial<Answer> = {
        ...mockAnswer,
        isValidated: true,
        status: 'validated' as 'pending' | 'validated' | 'rejected',
      };

      const scoredAnswer: Partial<Answer> = {
        ...validatedAnswer,
        relevanceScore: 0.8,
        accuracyScore: 0.7,
        completenessScore: 0.6,
        overallScore: 0.72,
      };

      const finalAnswer: Partial<Answer> = {
        ...scoredAnswer,
      };

      // Mock validation results
      const validationResults: Partial<AnswerValidation>[] = [
        {
          id: 'validation-1',
          answerId: mockAnswer.id!,
          validationType: ValidationResultType.RELEVANCE,
          status: ValidationStatus.PASSED,
          message: 'Test passed',
          confidence: 1.0,
          validationDetails: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock service methods
      generatorService.generateAnswer.mockResolvedValue(mockAnswer as Answer);
      validatorService.validateAnswerWithRules.mockResolvedValue(
        validationResults as AnswerValidation[],
      );
      scoringService.scoreAndSaveAnswer.mockResolvedValue(
        scoredAnswer as Answer,
      );
      answerRepository.save.mockResolvedValue(finalAnswer as Answer);

      // Act
      const result = await runner.run(generateAnswerDto);

      // Assert
      expect(result).toEqual(finalAnswer);
      expect(generatorService.generateAnswer).toHaveBeenCalledWith(
        generateAnswerDto,
      );
      expect(validatorService.validateAnswerWithRules).toHaveBeenCalledWith(
        mockAnswer as Answer,
        generateAnswerDto.query,
      );
      expect(scoringService.scoreAndSaveAnswer).toHaveBeenCalledWith(
        mockAnswer as Answer,
        generateAnswerDto.query,
      );
      expect(answerRepository.save).toHaveBeenCalled();
    });

    it('should handle errors during answer generation', async () => {
      // Arrange
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: '123',
        query: 'What is a test?',
        provider: 'test-provider',
        maxTokens: 500,
        temperature: 0.7,
      };

      const error = new Error('Failed to generate answer');
      generatorService.generateAnswer.mockRejectedValue(error);

      // Act & Assert
      await expect(runner.run(generateAnswerDto)).rejects.toThrow(error);
      expect(generatorService.generateAnswer).toHaveBeenCalledWith(
        generateAnswerDto,
      );
      expect(validatorService.validateAnswerWithRules).not.toHaveBeenCalled();
      expect(scoringService.scoreAndSaveAnswer).not.toHaveBeenCalled();
      expect(answerRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors during answer validation', async () => {
      // Arrange
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: '123',
        query: 'What is a test?',
        provider: 'test-provider',
        maxTokens: 500,
        temperature: 0.7,
      };

      const mockAnswer: Partial<Answer> = {
        id: 'answer-123',
        queryId: generateAnswerDto.queryId,
        content: 'This is a test answer.',
        provider: generateAnswerDto.provider,
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
      };

      const error = new Error('Failed to validate answer');
      generatorService.generateAnswer.mockResolvedValue(mockAnswer as Answer);
      validatorService.validateAnswerWithRules.mockRejectedValue(error);

      // Act & Assert
      await expect(runner.run(generateAnswerDto)).rejects.toThrow(error);
      expect(generatorService.generateAnswer).toHaveBeenCalledWith(
        generateAnswerDto,
      );
      expect(validatorService.validateAnswerWithRules).toHaveBeenCalledWith(
        mockAnswer as Answer,
        generateAnswerDto.query,
      );
      expect(scoringService.scoreAndSaveAnswer).not.toHaveBeenCalled();
      expect(answerRepository.save).not.toHaveBeenCalled();
    });

    it('should handle errors during answer scoring', async () => {
      // Arrange
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: '123',
        query: 'What is a test?',
        provider: 'test-provider',
        maxTokens: 500,
        temperature: 0.7,
      };

      const mockAnswer: Partial<Answer> = {
        id: 'answer-123',
        queryId: generateAnswerDto.queryId,
        content: 'This is a test answer.',
        provider: generateAnswerDto.provider,
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
      };

      // Mock validation results
      const validationResults: Partial<AnswerValidation>[] = [
        {
          id: 'validation-1',
          answerId: mockAnswer.id!,
          validationType: ValidationResultType.RELEVANCE,
          status: ValidationStatus.PASSED,
          message: 'Test passed',
          confidence: 1.0,
          validationDetails: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const error = new Error('Failed to score answer');
      generatorService.generateAnswer.mockResolvedValue(mockAnswer as Answer);
      validatorService.validateAnswerWithRules.mockResolvedValue(
        validationResults as AnswerValidation[],
      );
      scoringService.scoreAndSaveAnswer.mockRejectedValue(error);

      // Act & Assert
      await expect(runner.run(generateAnswerDto)).rejects.toThrow(error);
      expect(generatorService.generateAnswer).toHaveBeenCalledWith(
        generateAnswerDto,
      );
      expect(validatorService.validateAnswerWithRules).toHaveBeenCalledWith(
        mockAnswer as Answer,
        generateAnswerDto.query,
      );
      expect(scoringService.scoreAndSaveAnswer).toHaveBeenCalledWith(
        mockAnswer as Answer,
        generateAnswerDto.query,
      );
      expect(answerRepository.save).not.toHaveBeenCalled();
    });

    it('should handle rejected answers during validation', async () => {
      // Arrange
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: '123',
        query: 'What is a test?',
        provider: 'test-provider',
        maxTokens: 500,
        temperature: 0.7,
      };

      const mockAnswer: Partial<Answer> = {
        id: 'answer-123',
        queryId: generateAnswerDto.queryId,
        content: 'This is a test answer.',
        provider: generateAnswerDto.provider,
        providerMetadata: {},
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
        isValidated: false,
        status: 'pending' as 'pending' | 'validated' | 'rejected',
      };

      const scoredAnswer: Partial<Answer> = {
        ...mockAnswer,
        relevanceScore: 0.8,
        accuracyScore: 0.7,
        completenessScore: 0.6,
        overallScore: 0.72,
      };

      const rejectedAnswer: Partial<Answer> = {
        ...scoredAnswer,
        isValidated: true,
        status: 'rejected' as 'pending' | 'validated' | 'rejected',
      };

      // Mock validation results with a failure
      const validationResults: Partial<AnswerValidation>[] = [
        {
          id: 'validation-1',
          answerId: mockAnswer.id!,
          validationType: ValidationResultType.RELEVANCE,
          status: ValidationStatus.FAILED,
          message: 'Test failed',
          confidence: 1.0,
          validationDetails: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock service methods
      generatorService.generateAnswer.mockResolvedValue(mockAnswer as Answer);
      validatorService.validateAnswerWithRules.mockResolvedValue(
        validationResults as AnswerValidation[],
      );
      scoringService.scoreAndSaveAnswer.mockResolvedValue(
        scoredAnswer as Answer,
      );
      answerRepository.save.mockResolvedValue(rejectedAnswer as Answer);

      // Act
      const result = await runner.run(generateAnswerDto);

      // Assert
      expect(result).toEqual(rejectedAnswer);
      expect(result.status).toBe('rejected');
      expect(answerRepository.save).toHaveBeenCalled();
    });
  });
});
