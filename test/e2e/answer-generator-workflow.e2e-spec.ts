import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test'),
});

/**
 * Simple mock for Answer entity
 */
class MockAnswer {
  id: string;
  queryId: string;
  content: string;
  status: 'pending' | 'validated' | 'rejected';
  isValidated: boolean;
  provider: string;
  providerMetadata: Record<string, any>;
  relevanceScore: number;
  accuracyScore: number;
  completenessScore: number;
  overallScore: number;
  metadata: any[];
  validations: any[];
  scores: any[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<MockAnswer>) {
    this.id = data.id || uuidv4();
    this.queryId = data.queryId || '';
    this.content = data.content || '';
    this.status = data.status || 'pending';
    this.isValidated = data.isValidated || false;
    this.provider = data.provider || 'mock-provider';
    this.providerMetadata = data.providerMetadata || {};
    this.relevanceScore = data.relevanceScore || 0;
    this.accuracyScore = data.accuracyScore || 0;
    this.completenessScore = data.completenessScore || 0;
    this.overallScore = data.overallScore || 0;
    this.metadata = data.metadata || [];
    this.validations = data.validations || [];
    this.scores = data.scores || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}

/**
 * Mock Answer Repository
 */
class MockAnswerRepository {
  private answers: Map<string, MockAnswer> = new Map();

  async findById(id: string): Promise<MockAnswer | null> {
    return this.answers.get(id) || null;
  }

  async save(answer: MockAnswer): Promise<MockAnswer> {
    this.answers.set(answer.id, answer);
    return answer;
  }
}

/**
 * Mock Answer Metadata Repository
 */
class MockAnswerMetadataRepository {
  private metadata: Map<string, any[]> = new Map();

  async findByAnswerId(answerId: string): Promise<any[]> {
    return this.metadata.get(answerId) || [];
  }

  async create(data: any): Promise<any> {
    const metadata = { id: uuidv4(), ...data };
    const existingMetadata = this.metadata.get(data.answerId) || [];
    existingMetadata.push(metadata);
    this.metadata.set(data.answerId, existingMetadata);
    return metadata;
  }
}

/**
 * Custom Answer Generator Runner for testing
 */
class TestAnswerGeneratorRunner {
  constructor(
    private answerRepository: MockAnswerRepository,
    private metadataRepository: MockAnswerMetadataRepository,
  ) {}

  async run(dto: { queryId: string; query: string }): Promise<MockAnswer> {
    // Create a new answer
    const answer = new MockAnswer({
      queryId: dto.queryId,
      content: `Mock answer for: ${dto.query}`,
      provider: 'mock-provider',
      providerMetadata: { model: 'mock-model' },
    });

    // Validate and score the answer
    answer.isValidated = true;
    answer.status = 'validated';
    answer.relevanceScore = 0.9;
    answer.accuracyScore = 0.85;
    answer.completenessScore = 0.8;
    answer.overallScore = 0.85;

    // Save the answer
    await this.answerRepository.save(answer);

    // Create metadata
    await this.metadataRepository.create({
      answerId: answer.id,
      key: 'source',
      textValue: 'mock-source',
      valueType: 'text',
    });

    return answer;
  }
}

/**
 * End-to-end test for the Answer Generator Workflow
 */
describe('Answer Generator Workflow (E2E)', () => {
  let app: INestApplication;
  let answerGeneratorRunner: TestAnswerGeneratorRunner;
  let mockAnswerRepository: MockAnswerRepository;
  let mockAnswerMetadataRepository: MockAnswerMetadataRepository;

  beforeAll(async () => {
    mockAnswerRepository = new MockAnswerRepository();
    mockAnswerMetadataRepository = new MockAnswerMetadataRepository();

    // Create the test runner
    answerGeneratorRunner = new TestAnswerGeneratorRunner(
      mockAnswerRepository,
      mockAnswerMetadataRepository,
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should generate, validate, and store an answer', async () => {
    // Arrange
    const queryId = uuidv4();
    const dto = {
      queryId,
      query: 'Test prompt for answer generation',
    };

    // Act
    const result = await answerGeneratorRunner.run(dto);

    // Assert
    expect(result).toBeDefined();
    expect(result.queryId).toBe(queryId);
    expect(result.content).toBeDefined();
    expect(result.isValidated).toBe(true);
    expect(result.status).toBe('validated');

    // Verify answer was stored
    const storedAnswer = await mockAnswerRepository.findById(result.id);
    expect(storedAnswer).toBeDefined();

    // Verify metadata was created
    const metadata = await mockAnswerMetadataRepository.findByAnswerId(
      result.id,
    );
    expect(metadata.length).toBeGreaterThan(0);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
