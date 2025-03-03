import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import {
  AnswerValidation,
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';
import { RelevanceValidationRule } from '../../validation/rules/relevance-validation-rule';
import { Answer } from '../../entities/answer.entity';

describe('AnswerValidatorService', () => {
  let service: AnswerValidatorService;
  let validationRepository: jest.Mocked<Repository<AnswerValidation>>;
  let relevanceRule: jest.Mocked<RelevanceValidationRule>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mock implementations
    const mockValidationRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockRelevanceRule = {
      getType: jest.fn(),
      validate: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerValidatorService,
        {
          provide: getRepositoryToken(AnswerValidation),
          useValue: mockValidationRepository,
        },
        {
          provide: RelevanceValidationRule,
          useValue: mockRelevanceRule,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AnswerValidatorService>(AnswerValidatorService);
    validationRepository = module.get(
      getRepositoryToken(AnswerValidation),
    ) as jest.Mocked<Repository<AnswerValidation>>;
    relevanceRule = module.get(
      RelevanceValidationRule,
    ) as jest.Mocked<RelevanceValidationRule>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;

    // Set up default mock behavior
    configService.get.mockImplementation((key, defaultValue) => defaultValue);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateAnswer', () => {
    it('should validate answer against criteria', async () => {
      // Arrange
      const content =
        'This is a test answer that is long enough to pass validation.';
      const query = 'What is a test?';

      // Act
      const result = await service.validateAnswer(content, query);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should fail validation for short answers', async () => {
      // Arrange
      const content = 'Too short';
      const query = 'What is a test?';

      // Pass criteria directly instead of trying to mock defaultValidationCriteria
      const criteria = {
        minLength: 20,
        maxLength: 5000,
        requiredElements: [],
        prohibitedElements: [],
        minCitations: 0,
      };

      // Act
      const result = await service.validateAnswer(content, query, criteria);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.stringContaining('too short'),
      );
    });

    it('should fail validation for missing required elements', async () => {
      // Arrange
      const content =
        'This is a test answer that is long enough to pass validation.';
      const query = 'What is a test?';
      const criteria = {
        requiredElements: ['missing element'],
      };

      // Act
      const result = await service.validateAnswer(content, query, criteria);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.stringContaining('missing required element'),
      );
    });

    it('should fail validation for prohibited elements', async () => {
      // Arrange
      const content =
        'This is a test answer that contains a prohibited element.';
      const query = 'What is a test?';
      const criteria = {
        prohibitedElements: ['prohibited element'],
      };

      // Act
      const result = await service.validateAnswer(content, query, criteria);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.stringContaining('prohibited element'),
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const content = 'This is a test answer.';
      const query = 'What is a test?';
      const criteria = {
        minCitations: 1, // Require citations to trigger the countCitations method
      };

      // Mock an error in the countCitations method
      jest.spyOn(service as any, 'countCitations').mockImplementation(() => {
        throw new Error('Test error');
      });

      // Act
      const result = await service.validateAnswer(content, query, criteria);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.reasons).toContainEqual(
        expect.stringContaining('Error during validation'),
      );
    });
  });

  describe('validateAnswerWithRules', () => {
    it('should run all validation rules and save results', async () => {
      // Arrange
      const mockAnswer = {
        id: '123',
        queryId: '456',
        content: 'This is a test answer.',
        provider: 'test-provider',
        providerMetadata: { key: 'value' },
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

      const validationResult = {
        type: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Answer is relevant',
        confidence: 0.8,
        details: { score: 0.8 },
      };

      const savedValidation = {
        ...validationResult,
        id: '789',
        answerId: answer.id,
      };

      relevanceRule.getType.mockReturnValue(ValidationResultType.RELEVANCE);
      relevanceRule.validate.mockResolvedValue(validationResult);
      validationRepository.create.mockReturnValue(savedValidation as any);
      validationRepository.save.mockResolvedValue(savedValidation as any);

      // Act
      const results = await service.validateAnswerWithRules(answer, queryText);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(savedValidation);
      expect(relevanceRule.validate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryId: answer.queryId,
          queryText,
          answerContent: answer.content,
          provider: answer.provider,
          providerMetadata: answer.providerMetadata,
        }),
      );
      expect(validationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          validationType: validationResult.type,
          status: validationResult.status,
          message: validationResult.message,
          confidence: validationResult.confidence,
          validationDetails: validationResult.details,
        }),
      );
      expect(validationRepository.save).toHaveBeenCalledWith(savedValidation);
    });

    it('should handle validation rule errors', async () => {
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

      const error = new Error('Validation rule error');

      relevanceRule.getType.mockReturnValue(ValidationResultType.RELEVANCE);
      relevanceRule.validate.mockRejectedValue(error);

      const errorValidation = {
        id: '789',
        answerId: answer.id,
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.FAILED,
        message: `Error during validation: ${error.message}`,
        confidence: 1.0,
      };

      validationRepository.create.mockReturnValue(errorValidation as any);
      validationRepository.save.mockResolvedValue(errorValidation as any);

      // Act
      const results = await service.validateAnswerWithRules(answer, queryText);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(errorValidation);
      expect(validationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          answerId: answer.id,
          validationType: ValidationResultType.RELEVANCE,
          status: ValidationStatus.FAILED,
          message: `Error during validation: ${error.message}`,
          confidence: 1.0,
        }),
      );
    });
  });
});
