import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AnswerGeneratorService } from '../../services/answer-generator.service';
import { AnswerRepository } from '../../repositories/answer.repository';
import { AnswerMetadataRepository } from '../../repositories/answer-metadata.repository';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import { GenerateAnswerDto } from '../../dto/generate-answer.dto';
import { Answer } from '../../entities/answer.entity';

describe('AnswerGeneratorService', () => {
  let service: AnswerGeneratorService;
  let answerRepository: AnswerRepository;
  let metadataRepository: AnswerMetadataRepository;
  let validatorService: AnswerValidatorService;
  let scoringService: AnswerScoringService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, defaultValue) => defaultValue),
  };

  const mockAnswerRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  };

  const mockMetadataRepository = {
    create: jest.fn(),
    createMany: jest.fn(),
  };

  const mockValidatorService = {
    validateAnswer: jest.fn(),
  };

  const mockScoringService = {
    scoreAnswer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerGeneratorService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AnswerRepository, useValue: mockAnswerRepository },
        { provide: AnswerMetadataRepository, useValue: mockMetadataRepository },
        { provide: AnswerValidatorService, useValue: mockValidatorService },
        { provide: AnswerScoringService, useValue: mockScoringService },
      ],
    }).compile();

    service = module.get<AnswerGeneratorService>(AnswerGeneratorService);
    answerRepository = module.get<AnswerRepository>(AnswerRepository);
    metadataRepository = module.get<AnswerMetadataRepository>(
      AnswerMetadataRepository,
    );
    validatorService = module.get<AnswerValidatorService>(
      AnswerValidatorService,
    );
    scoringService = module.get<AnswerScoringService>(AnswerScoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAnswer', () => {
    const mockDto: GenerateAnswerDto = {
      queryId: '123',
      query: 'test query',
      provider: 'openai',
      maxTokens: 1000,
      temperature: 0.7,
      includeMetadata: true,
      validateAnswer: true,
    };

    const mockAnswer: Partial<Answer> = {
      id: 'answer-123',
      queryId: '123',
      content: 'This is a mock answer',
      provider: 'openai',
      relevanceScore: 0.8,
      accuracyScore: 0.7,
      completenessScore: 0.9,
      overallScore: 0.8,
      isValidated: true,
      status: 'validated',
    };

    beforeEach(() => {
      mockAnswerRepository.create.mockResolvedValue({
        id: 'answer-123',
        ...mockDto,
      });
      mockAnswerRepository.findById.mockResolvedValue(mockAnswer);
      mockValidatorService.validateAnswer.mockResolvedValue({ isValid: true });
      mockScoringService.scoreAnswer.mockResolvedValue({
        relevance: 0.8,
        accuracy: 0.7,
        completeness: 0.9,
        overall: 0.8,
      });
    });

    it('should generate an answer successfully', async () => {
      const result = await service.generateAnswer(mockDto);

      expect(mockAnswerRepository.create).toHaveBeenCalled();
      expect(mockValidatorService.validateAnswer).toHaveBeenCalled();
      expect(mockScoringService.scoreAnswer).toHaveBeenCalled();
      expect(mockAnswerRepository.update).toHaveBeenCalled();
      expect(mockAnswerRepository.findById).toHaveBeenCalled();

      expect(result).toEqual(mockAnswer);
    });

    it('should handle errors gracefully', async () => {
      mockAnswerRepository.create.mockRejectedValue(new Error('Test error'));

      await expect(service.generateAnswer(mockDto)).rejects.toThrow(
        'Test error',
      );
    });

    it('should throw an error if answer is not found after creation', async () => {
      mockAnswerRepository.findById.mockResolvedValue(null);

      await expect(service.generateAnswer(mockDto)).rejects.toThrow(
        'Failed to retrieve answer with ID: answer-123',
      );
    });
  });
});
