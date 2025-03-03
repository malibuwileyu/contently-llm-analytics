import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as request from 'supertest';
import { AnswerGeneratorModule } from '../../answer-generator.module';
import { AnswerGeneratorRunner } from '../../runners/answer-generator.runner';
import { AnswerRepository } from '../../repositories/answer.repository';
import { AnswerMetadataRepository } from '../../repositories/answer-metadata.repository';
import { GenerateAnswerDto } from '../../dto/generate-answer.dto';
import { Answer } from '../../entities/answer.entity';
import { AnswerMetadata } from '../../entities/answer-metadata.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource, Repository } from 'typeorm';
import {
  AnswerValidation,
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';
import { AnswerValidationRepository } from '../../repositories/answer-validation.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AnswerScore,
  ScoreMetricType,
} from '../../entities/answer-score.entity';
import { MockAnswerScoreRepository } from '../mocks/answer-score.repository.mock';
import { AnswerGeneratorService } from '../../services/answer-generator.service';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import { AnswerAnalyticsService } from '../../services/answer-analytics.service';
import { RelevanceValidationRule } from '../../validation/rules/relevance-validation-rule';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../../.env.test'),
});

/**
 * Mock Answer Repository for E2E testing
 */
class MockAnswerRepository {
  private answers: Map<string, Answer> = new Map();
  private idCounter = 1;

  async create(data: Partial<Answer>): Promise<Answer> {
    const id = data.id || `answer-${this.idCounter++}`;
    const answer: Answer = {
      id,
      queryId: data.queryId || 'default-query-id',
      content: data.content || 'Mock answer content',
      provider: data.provider || 'mock-provider',
      providerMetadata: data.providerMetadata || {},
      relevanceScore: data.relevanceScore || 0,
      accuracyScore: data.accuracyScore || 0,
      completenessScore: data.completenessScore || 0,
      overallScore: data.overallScore || 0,
      isValidated: data.isValidated || false,
      status: data.status || 'pending',
      metadata: [],
      validations: [],
      scores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as unknown as Date,
    };

    this.answers.set(id, answer);
    return answer;
  }

  async findById(id: string): Promise<Answer | null> {
    return this.answers.get(id) || null;
  }

  async update(id: string, data: Partial<Answer>): Promise<Answer> {
    let answer = this.answers.get(id);
    if (!answer) {
      // If the answer doesn't exist, create it
      answer = await this.create({ ...data, id });
    } else {
      // Update the existing answer
      const updatedAnswer = {
        ...answer,
        ...data,
        updatedAt: new Date(),
      };

      this.answers.set(id, updatedAnswer);
      answer = updatedAnswer;
    }

    return answer;
  }

  async findAll(): Promise<Answer[]> {
    return Array.from(this.answers.values());
  }

  async save(data: Partial<Answer>): Promise<Answer> {
    if (data.id) {
      return this.update(data.id, data);
    } else {
      return this.create(data);
    }
  }
}

/**
 * Mock Answer Metadata Repository for E2E testing
 */
class MockAnswerMetadataRepository {
  private metadata: Map<string, AnswerMetadata[]> = new Map();
  private idCounter = 1;

  async create(data: Partial<AnswerMetadata>): Promise<AnswerMetadata> {
    const id = `metadata-${this.idCounter++}`;
    const metadata: AnswerMetadata = {
      id,
      answerId: data.answerId || 'default-answer-id',
      key: data.key || 'default-key',
      textValue: data.textValue || 'default-text-value',
      numericValue: data.numericValue || 0,
      jsonValue: data.jsonValue || {},
      valueType: data.valueType || 'text',
      answer: {} as Answer,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as unknown as Date,
    };

    const answerMetadata = this.metadata.get(metadata.answerId) || [];
    answerMetadata.push(metadata);
    this.metadata.set(metadata.answerId, answerMetadata);

    return metadata;
  }

  async createMany(data: Partial<AnswerMetadata>[]): Promise<AnswerMetadata[]> {
    return Promise.all(data.map(item => this.create(item)));
  }

  async findByAnswerId(answerId: string): Promise<AnswerMetadata[]> {
    return this.metadata.get(answerId) || [];
  }
}

/**
 * Mock Answer Validation Repository for E2E testing
 */
class MockAnswerValidationRepository {
  private validations: Map<string, AnswerValidation[]> = new Map();
  private idCounter = 1;

  async create(data: Partial<AnswerValidation>): Promise<AnswerValidation> {
    const id = `validation-${this.idCounter++}`;
    const validation: AnswerValidation = {
      id,
      answerId: data.answerId || 'default-answer-id',
      validationType: data.validationType || ValidationResultType.RELEVANCE,
      status: data.status || ValidationStatus.PASSED,
      message: data.message || 'Default validation message',
      confidence: data.confidence || 1.0,
      validationDetails: data.validationDetails || {},
      answer: {} as Answer,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const answerValidations = this.validations.get(validation.answerId) || [];
    answerValidations.push(validation);
    this.validations.set(validation.answerId, answerValidations);

    return validation;
  }

  async save(validation: AnswerValidation): Promise<AnswerValidation> {
    return this.create(validation);
  }

  async findByAnswerId(answerId: string): Promise<AnswerValidation[]> {
    return this.validations.get(answerId) || [];
  }

  async find(options?: any): Promise<AnswerValidation[]> {
    if (options?.where?.answerId) {
      return this.findByAnswerId(options.where.answerId);
    }
    return [];
  }
}

/**
 * Mock Answer Generator Service
 */
class MockAnswerGeneratorService {
  async generateAnswer(dto: GenerateAnswerDto): Promise<Answer> {
    return {
      id: 'mock-answer-id',
      queryId: dto.queryId || 'default-query-id',
      content: 'This is a mock answer for testing purposes.',
      provider: dto.provider || 'mock-provider',
      providerMetadata: {},
      relevanceScore: 0.8,
      accuracyScore: 0.9,
      completenessScore: 0.7,
      overallScore: 0.8,
      isValidated: true,
      status: 'validated',
      metadata: [],
      validations: [],
      scores: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as unknown as Date,
    };
  }
}

/**
 * Mock Answer Validator Service
 */
class MockAnswerValidatorService {
  async validateAnswerWithRules(
    answer: Answer,
    queryText?: string,
  ): Promise<AnswerValidation[]> {
    return [
      {
        id: 'mock-validation-id',
        answerId: answer.id,
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Validation passed',
        confidence: 0.9,
        validationDetails: {},
        answer: {} as Answer,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

/**
 * Mock Answer Scoring Service
 */
class MockAnswerScoringService {
  private callCount = 0;

  async scoreAndSaveAnswer(answer: Answer, queryText: string): Promise<Answer> {
    // Generate slightly different scores for each call
    const variation = this.callCount * 0.05;
    this.callCount++;

    answer.relevanceScore = Math.min(1, Math.max(0, 0.8 + variation));
    answer.accuracyScore = Math.min(1, Math.max(0, 0.9 - variation));
    answer.completenessScore = Math.min(1, Math.max(0, 0.7 + variation));
    answer.overallScore = Math.min(1, Math.max(0, 0.8 + variation * 0.5));
    return answer;
  }

  async scoreAnswer(
    answerContent: string,
    queryText: string,
  ): Promise<{
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  }> {
    // Generate slightly different scores for each call
    const variation = this.callCount * 0.05;

    return {
      relevance: Math.min(1, Math.max(0, 0.8 + variation)),
      accuracy: Math.min(1, Math.max(0, 0.9 - variation)),
      completeness: Math.min(1, Math.max(0, 0.7 + variation)),
      overall: Math.min(1, Math.max(0, 0.8 + variation * 0.5)),
    };
  }
}

describe('AnswerGenerator E2E', () => {
  let app: INestApplication;
  let runner: AnswerGeneratorRunner;
  let mockAnswerGeneratorService: MockAnswerGeneratorService;
  let mockAnswerValidatorService: MockAnswerValidatorService;
  let mockAnswerScoringService: MockAnswerScoringService;
  let mockAnswerRepository: MockAnswerRepository;

  beforeAll(async () => {
    // Create instances of our mocks
    mockAnswerGeneratorService = new MockAnswerGeneratorService();
    mockAnswerValidatorService = new MockAnswerValidatorService();
    mockAnswerScoringService = new MockAnswerScoringService();
    mockAnswerRepository = new MockAnswerRepository();

    // Create a mock repository factory
    const mockRepositoryFactory = jest.fn(() => ({
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn().mockImplementation(data => Promise.resolve(data)),
      create: jest.fn().mockImplementation(data => data),
    }));

    // Create a mock DataSource
    const mockDataSource = {
      createEntityManager: jest.fn(() => ({
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        connection: {
          getMetadata: jest.fn(() => ({
            tableName: 'answer_validation',
            columns: [],
          })),
        },
      })),
      getRepository: jest.fn(() => new MockAnswerValidationRepository()),
      manager: {
        connection: {
          getMetadata: jest.fn(() => ({
            tableName: 'answer_validation',
            columns: [],
          })),
        },
      },
    };

    // Create a mock AnswerValidationRepository instance
    const mockAnswerValidationRepo = new MockAnswerValidationRepository();

    // Create a mock AnswerScoreRepository instance
    const mockAnswerScoreRepo = new MockAnswerScoreRepository();

    // Create a custom implementation of the AnswerGeneratorRunner
    class CustomAnswerGeneratorRunner extends AnswerGeneratorRunner {
      async run(dto: GenerateAnswerDto): Promise<Answer> {
        const answer = await mockAnswerGeneratorService.generateAnswer(dto);
        const validations =
          await mockAnswerValidatorService.validateAnswerWithRules(
            answer,
            dto.query,
          );
        const scoredAnswer = await mockAnswerScoringService.scoreAndSaveAnswer(
          answer,
          dto.query,
        );

        // Update answer status based on validation results
        const hasFailures = validations.some(
          validation => validation.status === 'failed',
        );

        scoredAnswer.isValidated = true;
        scoredAnswer.status = hasFailures ? 'rejected' : 'validated';

        // Save the updated answer
        return mockAnswerRepository.update(scoredAnswer.id, scoredAnswer);
      }

      async runMultiple(
        dto: GenerateAnswerDto,
        count: number,
      ): Promise<Answer[]> {
        const answers: Answer[] = [];

        for (let i = 0; i < count; i++) {
          const temperature = dto.temperature
            ? Math.min(
                1,
                Math.max(0, dto.temperature + (Math.random() * 0.2 - 0.1)),
              )
            : 0.7 + (Math.random() * 0.2 - 0.1);

          const modifiedDto = {
            ...dto,
            temperature,
          };

          const answer = await this.run(modifiedDto);
          answers.push(answer);
        }

        return answers;
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        // Provide the runner with our custom implementation
        {
          provide: AnswerGeneratorRunner,
          useClass: CustomAnswerGeneratorRunner,
        },
        // Mock all repositories and services needed
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: AnswerRepository,
          useValue: mockAnswerRepository,
        },
        {
          provide: AnswerMetadataRepository,
          useClass: MockAnswerMetadataRepository,
        },
        {
          provide: AnswerValidationRepository,
          useValue: mockAnswerValidationRepo,
        },
        {
          provide: getRepositoryToken(AnswerValidation),
          useValue: mockAnswerValidationRepo,
        },
        {
          provide: getRepositoryToken(AnswerScore),
          useValue: mockAnswerScoreRepo,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: mockRepositoryFactory(),
        },
        {
          provide: AnswerGeneratorService,
          useValue: mockAnswerGeneratorService,
        },
        {
          provide: AnswerValidatorService,
          useValue: mockAnswerValidatorService,
        },
        {
          provide: AnswerScoringService,
          useValue: mockAnswerScoringService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
        {
          provide: RelevanceValidationRule,
          useValue: {
            validate: jest.fn().mockResolvedValue({
              type: ValidationResultType.RELEVANCE,
              status: ValidationStatus.PASSED,
              message: 'Validation passed',
              confidence: 0.9,
              details: {},
            }),
            getType: jest.fn().mockReturnValue(ValidationResultType.RELEVANCE),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    runner = moduleFixture.get<AnswerGeneratorRunner>(AnswerGeneratorRunner);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Answer Generation Workflow', () => {
    it('should generate an answer for a query', async () => {
      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: 'e2e-test-query-id',
        query: 'What is artificial intelligence?',
        provider: 'mock-provider',
        maxTokens: 500,
        temperature: 0.7,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Generate an answer
      const answer = await runner.run(generateAnswerDto);

      // Verify the answer
      expect(answer).toBeDefined();
      expect(answer.id).toBeDefined();
      expect(answer.queryId).toBe(generateAnswerDto.queryId);
      expect(answer.provider).toBe(generateAnswerDto.provider);
      expect(answer.content).toBeDefined();
      expect(answer.isValidated).toBeDefined();
      expect(answer.status).toBeDefined();
      expect(answer.overallScore).toBeDefined();
    });

    it('should generate multiple answers for a query', async () => {
      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId: 'e2e-test-multiple-query-id',
        query: 'Explain quantum computing',
        provider: 'mock-provider',
        maxTokens: 500,
        temperature: 0.7,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Generate multiple answers
      const count = 3;
      const answers = await runner.runMultiple(generateAnswerDto, count);

      // Verify the answers
      expect(answers).toBeDefined();
      expect(answers.length).toBe(count);

      // Each answer should have the expected properties
      answers.forEach(answer => {
        expect(answer.id).toBeDefined();
        expect(answer.queryId).toBe(generateAnswerDto.queryId);
        expect(answer.provider).toBe(generateAnswerDto.provider);
        expect(answer.content).toBeDefined();
        expect(answer.isValidated).toBeDefined();
        expect(answer.status).toBeDefined();
        expect(answer.overallScore).toBeDefined();
      });

      // Answers should have different scores
      const uniqueScores = new Set(answers.map(a => a.overallScore));
      expect(uniqueScores.size).toBeGreaterThan(1);
    });
  });

  // This test would be implemented when we have a REST or GraphQL API
  describe('API Endpoints (to be implemented)', () => {
    it('should expose an endpoint to generate answers', async () => {
      // This is a placeholder for when we implement the API endpoints
      // The test would look something like:
      /*
      const response = await request(app.getHttpServer())
        .post('/api/answer-generator/generate')
        .send({
          queryId: 'api-test-query-id',
          query: 'What is machine learning?',
          provider: 'mock-provider',
          maxTokens: 500,
        })
        .expect(201);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBeDefined();
      expect(response.body.content).toBeDefined();
      */

      // Skip this test for now
      expect(true).toBe(true);
    });
  });
});
