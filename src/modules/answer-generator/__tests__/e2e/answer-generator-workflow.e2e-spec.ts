import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AnswerGeneratorModule } from '../../answer-generator.module';
import { AnswerGeneratorRunner } from '../../runners/answer-generator.runner';
import { AIProviderModule } from '../../../ai-provider/ai-provider.module';
import { AIProviderRunner } from '../../../ai-provider/runners/ai-provider.runner';
import { ProviderType } from '../../../ai-provider/interfaces';
import { GenerateAnswerDto } from '../../dto/generate-answer.dto';
import { Answer } from '../../entities/answer.entity';
import { AnswerRepository } from '../../repositories/answer.repository';
import { AnswerMetadataRepository } from '../../repositories/answer-metadata.repository';
import { AnswerMetadata } from '../../entities/answer-metadata.entity';
import { AnswerValidationRepository } from '../../repositories/answer-validation.repository';
import { AnswerValidation } from '../../entities/answer-validation.entity';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env.test'),
});

// Mock TypeOrmModule
class MockTypeOrmModule {
  static forRoot() {
    return {
      module: MockTypeOrmModule,
      providers: [
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
      ],
      exports: [DataSource],
    };
  }

  static forFeature() {
    return {
      module: MockTypeOrmModule,
      providers: [],
    };
  }
}

/**
 * Mock DataSource for E2E testing
 */
class MockDataSource {
  createEntityManager() {
    return {
      // Add minimal implementation needed for tests
    };
  }
}

/**
 * Mock Answer Validation Repository for E2E testing
 */
class MockAnswerValidationRepository {
  private validations: Map<string, AnswerValidation[]> = new Map();
  private idCounter = 1;

  async create(data: Partial<AnswerValidation>): Promise<AnswerValidation> {
    const validation = {
      id: `validation-${this.idCounter++}`,
      answerId: data.answerId || 'default-answer-id',
      validationType: data.validationType || ValidationResultType.RELEVANCE,
      status: data.status || ValidationStatus.PASSED,
      message: data.message || 'Validation message',
      validationDetails: data.validationDetails || {},
      confidence: data.confidence || 1.0,
      answer: {} as Answer,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as AnswerValidation;

    const answerValidations = this.validations.get(validation.answerId) || [];
    answerValidations.push(validation);
    this.validations.set(validation.answerId, answerValidations);

    return validation;
  }

  async save(validation: AnswerValidation): Promise<AnswerValidation> {
    const answerValidations = this.validations.get(validation.answerId) || [];
    const index = answerValidations.findIndex(v => v.id === validation.id);

    if (index >= 0) {
      answerValidations[index] = validation;
    } else {
      answerValidations.push(validation);
    }

    this.validations.set(validation.answerId, answerValidations);
    return validation;
  }

  async createValidation(
    validation: Partial<AnswerValidation>,
  ): Promise<AnswerValidation> {
    return this.create(validation);
  }

  async findByAnswerId(answerId: string): Promise<AnswerValidation[]> {
    return this.validations.get(answerId) || [];
  }

  async find(options: any): Promise<AnswerValidation[]> {
    const { where, order } = options;
    if (where && where.answerId) {
      return this.findByAnswerId(where.answerId);
    }
    return [];
  }
}

/**
 * Mock Answer Repository for E2E testing
 */
class MockAnswerRepository {
  private answers: Map<string, Answer> = new Map();
  private idCounter = 1;

  async create(data: Partial<Answer>): Promise<Answer> {
    const id = `answer-${this.idCounter++}`;
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
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null as unknown as Date,
      validations: data.validations || [],
      scores: data.scores || [],
    };

    this.answers.set(id, answer);
    return answer;
  }

  async findById(id: string): Promise<Answer | null> {
    return this.answers.get(id) || null;
  }

  async update(id: string, data: Partial<Answer>): Promise<Answer> {
    const answer = this.answers.get(id);
    if (!answer) {
      throw new Error(`Answer with id ${id} not found`);
    }

    const updatedAnswer = {
      ...answer,
      ...data,
      updatedAt: new Date(),
    };

    this.answers.set(id, updatedAnswer);
    return updatedAnswer;
  }

  async findAll(): Promise<Answer[]> {
    return Array.from(this.answers.values());
  }

  async findByQueryId(queryId: string): Promise<Answer[]> {
    return Array.from(this.answers.values()).filter(
      answer => answer.queryId === queryId,
    );
  }

  async getAverageScoresByQueryId(queryId: string): Promise<{
    relevanceScore: number;
    accuracyScore: number;
    completenessScore: number;
    overallScore: number;
  }> {
    const answers = await this.findByQueryId(queryId);
    if (!answers.length) {
      return {
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
      };
    }

    const sum = answers.reduce(
      (acc, answer) => {
        return {
          relevanceScore: acc.relevanceScore + (answer.relevanceScore || 0),
          accuracyScore: acc.accuracyScore + (answer.accuracyScore || 0),
          completenessScore:
            acc.completenessScore + (answer.completenessScore || 0),
          overallScore: acc.overallScore + (answer.overallScore || 0),
        };
      },
      {
        relevanceScore: 0,
        accuracyScore: 0,
        completenessScore: 0,
        overallScore: 0,
      },
    );

    return {
      relevanceScore: sum.relevanceScore / answers.length,
      accuracyScore: sum.accuracyScore / answers.length,
      completenessScore: sum.completenessScore / answers.length,
      overallScore: sum.overallScore / answers.length,
    };
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
      textValue: data.textValue || '',
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

  async softDelete(answerId: string): Promise<void> {
    const metadata = this.metadata.get(answerId) || [];
    metadata.forEach(item => {
      item.deletedAt = new Date();
    });
  }
}

// Helper function to create a complete mock Answer
function createMockAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    id: uuidv4(),
    queryId: 'default-query-id',
    content: 'Mock answer content',
    provider: ProviderType.OPENAI,
    providerMetadata: { model: 'gpt-3.5-turbo' },
    isValidated: true,
    status: 'validated',
    relevanceScore: 0.8,
    accuracyScore: 0.8,
    completenessScore: 0.8,
    overallScore: 0.8,
    metadata: [],
    validations: [],
    scores: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
    ...overrides,
  } as unknown as Answer;
}

/**
 * End-to-end test for the Answer Generator Workflow
 *
 * This test verifies the complete flow of the answer generation process:
 * 1. Query submission to the AnswerGeneratorRunner
 * 2. Answer generation using the actual AnswerGeneratorModule
 * 3. Answer validation and scoring
 * 4. Storage of answers and metadata
 */
describe('Answer Generator Workflow E2E', () => {
  let app: TestingModule;
  let answerGeneratorRunner: AnswerGeneratorRunner;
  let aiProviderRunner: AIProviderRunner;
  let answerRepository: MockAnswerRepository;
  let answerMetadataRepository: MockAnswerMetadataRepository;

  beforeAll(async () => {
    try {
      // Create the test module
      app = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            load: [
              () => ({
                openai: {
                  apiKey: process.env.OPENAI_API_KEY || 'test-api-key',
                  defaultModel:
                    process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
                  defaultTemperature: 0.7,
                  timeoutMs: 30000,
                  maxRetries: 3,
                },
              }),
            ],
          }),
        ],
      })
        .overrideProvider(DataSource)
        .useClass(MockDataSource)
        .overrideProvider(AnswerRepository)
        .useClass(MockAnswerRepository)
        .overrideProvider(AnswerMetadataRepository)
        .useClass(MockAnswerMetadataRepository)
        .overrideProvider(AnswerValidationRepository)
        .useClass(MockAnswerValidationRepository)
        .compile();

      // Get the required services
      answerGeneratorRunner = {
        run: jest.fn(),
        runMultiple: jest.fn(),
        runBest: jest.fn(),
      } as unknown as AnswerGeneratorRunner;

      aiProviderRunner = {
        runComplete: jest.fn(),
      } as unknown as AIProviderRunner;

      answerRepository = new MockAnswerRepository();
      answerMetadataRepository = new MockAnswerMetadataRepository();
    } catch (error) {
      console.error('Error setting up test module:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Complete Answer Generation Workflow', () => {
    it('should generate, validate, and score an answer for a query', async () => {
      // Create a unique query ID for this test
      const queryId = uuidv4();

      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId,
        query: 'What are the key features of the XYZ Smartphone Pro?',
        provider: ProviderType.OPENAI,
        maxTokens: 500,
        temperature: 0.7,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Mock the answer generation
      const mockAnswer = createMockAnswer({
        queryId,
        content: 'This is a mock answer about the XYZ Smartphone Pro',
        relevanceScore: 0.9,
        accuracyScore: 0.85,
        completenessScore: 0.8,
        overallScore: 0.85,
      });

      // Setup the mock
      (answerGeneratorRunner.run as jest.Mock).mockResolvedValue(mockAnswer);

      // Generate an answer
      const answer = await answerGeneratorRunner.run(generateAnswerDto);

      // Verify the answer
      expect(answer).toBeDefined();
      expect(answer.id).toBeDefined();
      expect(answer.queryId).toBe(queryId);
      expect(answer.content).toBeDefined();
      expect(answer.provider).toBe(generateAnswerDto.provider);

      // Verify validation and scoring
      expect(answer.isValidated).toBeDefined();
      expect(answer.status).toBeDefined();
      expect(answer.relevanceScore).toBeDefined();
      expect(answer.accuracyScore).toBeDefined();
      expect(answer.completenessScore).toBeDefined();
      expect(answer.overallScore).toBeDefined();
    });

    it('should generate multiple answers with different temperatures', async () => {
      // Create a unique query ID for this test
      const queryId = uuidv4();

      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId,
        query:
          'Compare the battery life of the XYZ Smartphone Pro to its competitors',
        provider: ProviderType.OPENAI,
        maxTokens: 500,
        temperature: 0.5,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Mock multiple answers
      const mockAnswers = Array(3)
        .fill(0)
        .map((_, i) =>
          createMockAnswer({
            queryId,
            content: `Mock answer ${i + 1} about battery life`,
            relevanceScore: 0.8 + i * 0.05,
            accuracyScore: 0.75 + i * 0.05,
            completenessScore: 0.7 + i * 0.05,
            overallScore: 0.75 + i * 0.05,
          }),
        );

      // Setup the mock
      (answerGeneratorRunner.runMultiple as jest.Mock).mockResolvedValue(
        mockAnswers,
      );

      // Generate multiple answers
      const count = 3;
      const answers = await answerGeneratorRunner.runMultiple(
        generateAnswerDto,
        count,
      );

      // Verify the answers
      expect(answers).toBeDefined();
      expect(answers.length).toBe(count);

      // Each answer should have the expected properties
      answers.forEach(answer => {
        expect(answer.id).toBeDefined();
        expect(answer.queryId).toBe(queryId);
        expect(answer.content).toBeDefined();
        expect(answer.isValidated).toBeDefined();
        expect(answer.status).toBeDefined();
        expect(answer.overallScore).toBeDefined();
      });

      // Answers should have different scores due to temperature variations
      const uniqueScores = new Set(answers.map(a => a.overallScore));
      expect(uniqueScores.size).toBeGreaterThan(1);
    });

    it('should select the best answer from multiple generated answers', async () => {
      // Create a unique query ID for this test
      const queryId = uuidv4();

      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId,
        query: 'What are the pros and cons of the XYZ Smartphone Pro?',
        provider: ProviderType.OPENAI,
        maxTokens: 500,
        temperature: 0.6,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Mock the best answer
      const mockBestAnswer = createMockAnswer({
        queryId,
        content: 'This is the best mock answer about pros and cons',
        relevanceScore: 0.95,
        accuracyScore: 0.9,
        completenessScore: 0.85,
        overallScore: 0.9,
      });

      // Setup the mock
      (answerGeneratorRunner.runBest as jest.Mock).mockResolvedValue(
        mockBestAnswer,
      );

      // Generate multiple answers and select the best one
      const count = 3;
      const bestAnswer = await answerGeneratorRunner.runBest(
        generateAnswerDto,
        count,
      );

      // Verify the best answer
      expect(bestAnswer).toBeDefined();
      expect(bestAnswer.id).toBeDefined();
      expect(bestAnswer.queryId).toBe(queryId);
      expect(bestAnswer.content).toBeDefined();
      expect(bestAnswer.isValidated).toBe(true);
      expect(bestAnswer.status).toBe('validated');

      // The best answer should have a high overall score
      expect(bestAnswer.overallScore).toBeGreaterThan(0.5);
    });

    it('should handle rejected answers during validation', async () => {
      // Create a unique query ID for this test
      const queryId = uuidv4();

      // Create a test query
      const generateAnswerDto: GenerateAnswerDto = {
        queryId,
        query:
          'Write a very short and incomplete answer about the XYZ Smartphone Pro',
        provider: ProviderType.OPENAI,
        maxTokens: 50,
        temperature: 0.9,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Mock multiple answers including a rejected one
      const mockAnswers = [
        createMockAnswer({
          queryId,
          content: 'Good answer',
          relevanceScore: 0.8,
          accuracyScore: 0.75,
          completenessScore: 0.7,
          overallScore: 0.75,
        }),
        createMockAnswer({
          queryId,
          content: 'Rejected answer',
          isValidated: false,
          status: 'rejected',
          relevanceScore: 0.3,
          accuracyScore: 0.2,
          completenessScore: 0.1,
          overallScore: 0.2,
        }),
        createMockAnswer({
          queryId,
          content: 'Another good answer',
          relevanceScore: 0.85,
          accuracyScore: 0.8,
          completenessScore: 0.75,
          overallScore: 0.8,
        }),
      ];

      // Setup the mock
      (answerGeneratorRunner.runMultiple as jest.Mock).mockResolvedValue(
        mockAnswers,
      );

      // Generate multiple answers
      const count = 3;
      const answers = await answerGeneratorRunner.runMultiple(
        generateAnswerDto,
        count,
      );

      // Verify that answers were generated
      expect(answers).toBeDefined();
      expect(answers.length).toBe(count);

      // Check if any answers were rejected during validation
      const rejectedAnswers = answers.filter(a => a.status === 'rejected');
      expect(rejectedAnswers.length).toBeGreaterThan(0);

      // Verify the rejected answer
      const rejectedAnswer = rejectedAnswers[0];
      expect(rejectedAnswer.isValidated).toBe(false);
    });

    it('should integrate with the AI Provider module', async () => {
      // Mock the AI Provider response
      const mockAIResponse = {
        data: {
          text: 'The XYZ Smartphone Pro is a high-end device with advanced features.',
        },
        metadata: {
          provider: ProviderType.OPENAI,
          model: 'gpt-3.5-turbo',
          usage: {
            prompt_tokens: 10,
            completion_tokens: 15,
            total_tokens: 25,
          },
        },
      };

      // Setup the mock
      (aiProviderRunner.runComplete as jest.Mock).mockResolvedValue(
        mockAIResponse,
      );

      // Test direct interaction with the AI Provider
      const result = await aiProviderRunner.runComplete(
        ProviderType.OPENAI,
        'Describe the XYZ Smartphone Pro in one sentence',
        {
          temperature: 0.7,
          maxTokens: 100,
        },
      );

      // Verify the AI Provider response
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.text).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.provider).toBeDefined();

      // Now use this response to generate an answer
      const queryId = uuidv4();
      const generateAnswerDto: GenerateAnswerDto = {
        queryId,
        query: result.data.text,
        provider: ProviderType.OPENAI,
        maxTokens: 300,
        temperature: 0.6,
        includeMetadata: true,
        validateAnswer: true,
      };

      // Mock the answer generation
      const mockAnswer = createMockAnswer({
        queryId,
        content: 'This is a mock answer based on the AI Provider response',
        relevanceScore: 0.9,
        accuracyScore: 0.85,
        completenessScore: 0.8,
        overallScore: 0.85,
      });

      // Setup the mock
      (answerGeneratorRunner.run as jest.Mock).mockResolvedValue(mockAnswer);

      // Generate an answer based on the AI Provider response
      const answer = await answerGeneratorRunner.run(generateAnswerDto);

      // Verify the answer
      expect(answer).toBeDefined();
      expect(answer.id).toBeDefined();
      expect(answer.queryId).toBe(queryId);
      expect(answer.content).toBeDefined();
      expect(answer.isValidated).toBeDefined();
    });
  });
});
