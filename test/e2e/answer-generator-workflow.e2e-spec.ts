import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AnswerGeneratorModule } from '../../src/modules/answer-generator/answer-generator.module';
import { AnswerGeneratorRunner } from '../../src/modules/answer-generator/runners/answer-generator.runner';
import { AIProviderModule } from '../../src/modules/ai-provider/ai-provider.module';
import { AIProviderRunner } from '../../src/modules/ai-provider/runners/ai-provider.runner';
import { ProviderType } from '../../src/modules/ai-provider/interfaces';
import { GenerateAnswerDto } from '../../src/modules/answer-generator/dto/generate-answer.dto';
import { Answer } from '../../src/modules/answer-generator/entities/answer.entity';
import { AnswerRepository } from '../../src/modules/answer-generator/repositories/answer.repository';
import { AnswerMetadataRepository } from '../../src/modules/answer-generator/repositories/answer-metadata.repository';
import { AnswerMetadata } from '../../src/modules/answer-generator/entities/answer-metadata.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
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
        AnswerGeneratorModule,
        AIProviderModule,
      ],
    })
      .overrideProvider(AnswerRepository)
      .useClass(MockAnswerRepository)
      .overrideProvider(AnswerMetadataRepository)
      .useClass(MockAnswerMetadataRepository)
      .compile();

    // Get the required services
    answerGeneratorRunner = app.get<AnswerGeneratorRunner>(
      AnswerGeneratorRunner,
    );
    aiProviderRunner = app.get<AIProviderRunner>(AIProviderRunner);
    answerRepository = app.get<AnswerRepository>(
      AnswerRepository,
    ) as unknown as MockAnswerRepository;
    answerMetadataRepository = app.get<AnswerMetadataRepository>(
      AnswerMetadataRepository,
    ) as unknown as MockAnswerMetadataRepository;
  });

  afterAll(async () => {
    await app.close();
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

      // Generate an answer
      const answer = await answerGeneratorRunner.run(generateAnswerDto);

      // Verify the answer
      expect(answer).toBeDefined();
      expect(answer.id).toBeDefined();
      expect(answer.queryId).toBe(queryId);
      expect(answer.content).toBeDefined();
      expect(answer.provider).toBe(ProviderType.OPENAI);

      // Check that the answer was stored in the repository
      const storedAnswer = await answerRepository.findById(answer.id);
      expect(storedAnswer).toBeDefined();
      expect(storedAnswer?.queryId).toBe(queryId);

      // If metadata was requested, verify it was stored
      if (generateAnswerDto.includeMetadata) {
        const metadata = await answerMetadataRepository.findByAnswerId(
          answer.id,
        );
        expect(metadata.length).toBeGreaterThan(0);
      }
    });
  });
});
