import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AnswerGeneratorRunner } from '../../runners/answer-generator.runner';
import { ProviderType } from '../../../ai-provider/interfaces';
import { GenerateAnswerDto } from '../../dto/generate-answer.dto';
import { Answer } from '../../entities/answer.entity';
import { AnswerRepository } from '../../repositories/answer.repository';
import { AnswerMetadataRepository } from '../../repositories/answer-metadata.repository';
import { AnswerMetadata } from '../../entities/answer-metadata.entity';
import { AnswerGeneratorService } from '../../services/answer-generator.service';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import { AIProviderFactoryService } from '../../../ai-provider/services/ai-provider-factory.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../../../../.env.test'),
});

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
      validations: data.validations || [],
      scores: data.scores || [],
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

  // TypeORM Repository methods
  async save(entity: Partial<Answer>): Promise<Answer> {
    if (entity.id) {
      return this.update(entity.id, entity);
    } else {
      return this.create(entity);
    }
  }

  async findOne(options: any): Promise<Answer | null> {
    if (options.where?.id) {
      return this.findById(options.where.id);
    }
    return null;
  }

  async find(options?: any): Promise<Answer[]> {
    if (options?.where?.queryId) {
      return this.findByQueryId(options.where.queryId);
    }
    return this.findAll();
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

  // TypeORM Repository methods
  async save(entity: Partial<AnswerMetadata>): Promise<AnswerMetadata> {
    return this.create(entity);
  }

  async find(options?: any): Promise<AnswerMetadata[]> {
    if (options?.where?.answerId) {
      return this.findByAnswerId(options.where.answerId);
    }
    return [];
  }
}

/**
 * Mock AI Provider Factory Service
 */
class MockAIProviderFactoryService {
  async getBestProviderByType(type: ProviderType) {
    return {
      type,
      name: 'MockProvider',
      priority: 10,
      capabilities: {
        chat: true,
        complete: true,
        embed: false,
        search: false,
      },
      complete: async (prompt: string, options: any = {}) => {
        return {
          data: {
            text: `This is a mock response for prompt: "${prompt}"`,
          },
          metadata: {
            provider: 'MockProvider',
            model: 'mock-model',
            timestamp: new Date(),
            latencyMs: 100,
            usage: {
              promptTokens: 10,
              completionTokens: 20,
              totalTokens: 30,
            },
          },
        };
      },
      chat: async (messages: any[], options: any = {}) => {
        return {
          data: {
            text: `This is a mock response for chat`,
          },
          metadata: {
            provider: 'MockProvider',
            model: 'mock-model',
            timestamp: new Date(),
            latencyMs: 100,
            usage: {
              promptTokens: 10,
              completionTokens: 20,
              totalTokens: 30,
            },
          },
        };
      },
      isAvailable: async () => true,
      getName: () => 'MockProvider',
      getCapabilities: () => ['complete', 'chat'],
      embed: async () => {
        throw new Error('Not implemented');
      },
      search: async () => {
        throw new Error('Not implemented');
      },
    };
  }
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
  let answerRepository: MockAnswerRepository;
  let answerMetadataRepository: MockAnswerMetadataRepository;
  let aiProviderFactoryService: MockAIProviderFactoryService;

  beforeAll(async () => {
    // Create mock repositories
    answerRepository = new MockAnswerRepository();
    answerMetadataRepository = new MockAnswerMetadataRepository();
    aiProviderFactoryService = new MockAIProviderFactoryService();

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
      providers: [
        {
          provide: AnswerRepository,
          useValue: answerRepository,
        },
        {
          provide: AnswerMetadataRepository,
          useValue: answerMetadataRepository,
        },
        {
          provide: AIProviderFactoryService,
          useValue: aiProviderFactoryService,
        },
        {
          provide: getRepositoryToken(Answer),
          useValue: answerRepository,
        },
        {
          provide: getRepositoryToken(AnswerMetadata),
          useValue: answerMetadataRepository,
        },
        {
          provide: AnswerValidatorService,
          useValue: {
            validateAnswer: jest
              .fn()
              .mockImplementation(async (content, query) => {
                // Simple mock validation logic
                const isValid = content.length > 20;
                return {
                  isValid,
                  reasons: isValid ? [] : ['Content too short'],
                };
              }),
            validateAnswerWithRules: jest
              .fn()
              .mockImplementation(async answer => {
                return [
                  {
                    rule: 'content-length',
                    status: answer.content.length > 20 ? 'passed' : 'failed',
                    message:
                      answer.content.length > 20
                        ? 'Content length is sufficient'
                        : 'Content too short',
                  },
                ];
              }),
          },
        },
        {
          provide: AnswerScoringService,
          useValue: {
            scoreAnswer: jest
              .fn()
              .mockImplementation(async (content, query) => {
                // Simple mock scoring logic
                const baseScore = 0.7;
                const randomVariation = Math.random() * 0.3;
                return {
                  relevance: baseScore + randomVariation,
                  accuracy: baseScore + randomVariation,
                  completeness: baseScore + randomVariation,
                  overall: baseScore + randomVariation,
                };
              }),
            scoreAndSaveAnswer: jest
              .fn()
              .mockImplementation(async (answer, query) => {
                // Simple mock scoring logic
                const baseScore = 0.7;
                const randomVariation = Math.random() * 0.3;

                answer.relevanceScore = baseScore + randomVariation;
                answer.accuracyScore = baseScore + randomVariation;
                answer.completenessScore = baseScore + randomVariation;
                answer.overallScore = baseScore + randomVariation;

                return answer;
              }),
          },
        },
        AnswerGeneratorService,
        AnswerGeneratorRunner,
      ],
    }).compile();

    // Get the required services
    answerGeneratorRunner = app.get<AnswerGeneratorRunner>(
      AnswerGeneratorRunner,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Answer Generation Workflow', () => {
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

      // Verify metadata was created
      const metadata = await answerMetadataRepository.findByAnswerId(answer.id);
      expect(metadata.length).toBeGreaterThan(0);
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

      // Verify that multiple answers were generated
      const allAnswers = await answerRepository.findByQueryId(queryId);
      expect(allAnswers.length).toBe(count);

      // The best answer should have the highest overall score
      const highestScore = Math.max(...allAnswers.map(a => a.overallScore));
      expect(bestAnswer.overallScore).toBe(highestScore);
    });
  });
});
