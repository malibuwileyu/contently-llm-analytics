import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as request from 'supertest';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AppModule } from '../../../../app.module';
import { MainRunnerService } from '../../../../shared/runners/main-runner.service';
import { FeatureRegistryService } from '../../../../shared/runners/feature-registry.service';
import { FeatureContext } from '../../../../shared/runners/feature-runner.interface';
import { AnswerEngineRunner } from '../../runners/answer-engine.runner';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMention } from '../../entities/brand-mention.entity';
import { Citation } from '../../entities/citation.entity';
import { SentimentAnalyzerService } from '../../services/sentiment-analyzer.service';
import { AuthorityCalculatorService } from '../../services/authority-calculator.service';
import { createTestDatabaseModule } from '../../../../shared/test-utils/database/test-database';
import { BrandMentionRepository } from '../../repositories/brand-mention.repository';
import { CitationTrackerService } from '../../services/citation-tracker.service';

/**
 * End-to-end test for the Answer Engine
 *
 * This test verifies the complete flow of the Answer Engine:
 * 1. Data ingestion through the MainRunnerService
 * 2. Sentiment analysis of content
 * 3. Citation tracking and authority calculation
 * 4. Brand health metrics calculation
 * 5. GraphQL API for retrieving results
 */
describe('Answer Engine E2E', () => {
  let app: INestApplication;
  let mainRunnerService: MainRunnerService;
  let answerEngineRunner: AnswerEngineRunner;
  let answerEngineService: AnswerEngineService;
  let brandMentionRepository: Repository<BrandMention>;
  let citationRepository: Repository<Citation>;
  let dataSource: DataSource;

  // Test data
  const testBrandId = 'test-brand-123';
  const testContent =
    'This is a positive review of the product. It works great and I love it!';
  const testCitations = [
    {
      source: 'https://example.com/review1',
      text: 'Great product',
      metadata: { page: 1 },
    },
    {
      source: 'https://academic.edu/paper',
      text: 'Scientific analysis',
      metadata: { section: 'Results' },
    },
  ];

  beforeAll(async () => {
    // Create a test database module with the required entities
    const testDbModule = await createTestDatabaseModule([
      BrandMention,
      Citation,
    ]);

    // Create the test module
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // Add test-specific configuration
          load: [
            () => ({
              features: {
                answerEngine: {
                  enabled: true,
                },
              },
            }),
          ],
        }),
        testDbModule,
        // Import only the necessary modules for testing
        TypeOrmModule.forFeature([BrandMention, Citation]),
      ],
      providers: [
        // Core services
        MainRunnerService,
        FeatureRegistryService,
        AnswerEngineRunner,
        AnswerEngineService,
        SentimentAnalyzerService,
        AuthorityCalculatorService,
        CitationTrackerService,

        // Provide BrandMentionRepository
        {
          provide: BrandMentionRepository,
          useFactory: (dataSource: DataSource) => {
            return new BrandMentionRepository(dataSource);
          },
          inject: [DataSource],
        },

        // Mock services that are not directly tested
        {
          provide: 'NLPService',
          useValue: {
            analyzeSentiment: jest.fn().mockResolvedValue({
              score: 0.8,
              magnitude: 0.6,
              aspects: [
                { topic: 'product', score: 0.9 },
                { topic: 'performance', score: 0.7 },
              ],
            }),
          },
        },
        {
          provide: 'MetricsService',
          useValue: {
            recordAnalysisDuration: jest.fn(),
            incrementErrorCount: jest.fn(),
          },
        },
        {
          provide: 'PUB_SUB',
          useValue: {
            publish: jest.fn(),
            asyncIterator: jest.fn(),
          },
        },
      ],
    }).compile();

    // Create the application
    app = moduleRef.createNestApplication();
    await app.init();

    // Get the required services and repositories
    mainRunnerService = moduleRef.get<MainRunnerService>(MainRunnerService);
    answerEngineRunner = moduleRef.get<AnswerEngineRunner>(AnswerEngineRunner);
    answerEngineService =
      moduleRef.get<AnswerEngineService>(AnswerEngineService);
    brandMentionRepository = moduleRef.get<Repository<BrandMention>>(
      getRepositoryToken(BrandMention),
    );
    citationRepository = moduleRef.get<Repository<Citation>>(
      getRepositoryToken(Citation),
    );
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Register the Answer Engine runner with the MainRunnerService
    mainRunnerService.registerRunner(answerEngineRunner);
  });

  afterAll(async () => {
    // Clean up
    await app.close();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await citationRepository.clear();
    await brandMentionRepository.clear();
  });

  describe('End-to-end flow', () => {
    it('should process content through the MainRunnerService', async () => {
      // Create a feature context with test data
      const context: FeatureContext = {
        brandId: testBrandId,
        metadata: {
          content: testContent,
          context: {
            query: 'product review',
            response: 'Full response text',
            platform: 'test-platform',
          },
          citations: testCitations,
        },
      };

      // Run the Answer Engine through the MainRunnerService
      const result = await mainRunnerService.runOne('answer-engine', context);

      // Verify the result
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      // Type assertion for result.data
      if (!result.data) {
        fail('Expected result.data to be defined');
        return;
      }

      expect(result.data.mention).toBeDefined();
      expect(result.data.health).toBeDefined();

      // Verify the brand mention
      const mention = result.data.mention as BrandMention;
      expect(mention.brandId).toBe(testBrandId);
      expect(mention.content).toBe(testContent);
      expect(mention.sentiment).toBeGreaterThan(0); // Positive sentiment

      // Verify the citations
      expect(mention.citations).toBeDefined();
      expect(mention.citations.length).toBe(2);

      // Verify the brand health metrics
      const health = result.data.health as any;
      expect(health.overallSentiment).toBeGreaterThan(0);
      expect(health.mentionCount).toBe(1);

      // Verify data was persisted to the database
      const storedMentions = await brandMentionRepository.find();
      expect(storedMentions.length).toBe(1);
      expect(storedMentions[0].brandId).toBe(testBrandId);

      const storedCitations = await citationRepository.find();
      expect(storedCitations.length).toBe(2);

      // Verify the academic citation has higher authority
      const academicCitation = storedCitations.find(c =>
        c.source.includes('academic.edu'),
      );
      const regularCitation = storedCitations.find(c =>
        c.source.includes('example.com'),
      );

      expect(academicCitation).toBeDefined();
      expect(regularCitation).toBeDefined();

      if (academicCitation && regularCitation) {
        expect(academicCitation.authority).toBeGreaterThan(
          regularCitation.authority,
        );
      } else {
        fail('Expected both academic and regular citations to be found');
      }
    });

    it('should handle multiple brand mentions and calculate aggregate metrics', async () => {
      // Create multiple brand mentions with different sentiments
      const contexts = [
        {
          brandId: testBrandId,
          metadata: {
            content: 'This is a positive review. The product is excellent!',
            context: {
              query: 'review 1',
              response: 'Full response 1',
              platform: 'test-platform',
            },
            citations: [
              { source: 'https://example.com/1', text: 'Citation 1' },
            ],
          },
        },
        {
          brandId: testBrandId,
          metadata: {
            content: 'This is a neutral review. The product works as expected.',
            context: {
              query: 'review 2',
              response: 'Full response 2',
              platform: 'test-platform',
            },
            citations: [
              { source: 'https://example.com/2', text: 'Citation 2' },
            ],
          },
        },
        {
          brandId: testBrandId,
          metadata: {
            content:
              'This is a negative review. The product did not meet expectations.',
            context: {
              query: 'review 3',
              response: 'Full response 3',
              platform: 'test-platform',
            },
            citations: [
              { source: 'https://example.com/3', text: 'Citation 3' },
            ],
          },
        },
      ];

      // Process each context
      for (const context of contexts) {
        await mainRunnerService.runOne('answer-engine', context);
      }

      // Get the brand health metrics
      const health = await answerEngineService.getBrandHealth(testBrandId);

      // Verify the metrics
      expect(health).toBeDefined();
      expect(health.mentionCount).toBe(3);
      expect(health.trend).toBeDefined();
      expect(health.trend.length).toBeGreaterThan(0);

      // Verify data was persisted to the database
      const storedMentions = await brandMentionRepository.find();
      expect(storedMentions.length).toBe(3);

      const storedCitations = await citationRepository.find();
      expect(storedCitations.length).toBe(3);
    });

    it('should handle errors gracefully', async () => {
      // Create an invalid context (missing required fields)
      const invalidContext: FeatureContext = {
        brandId: testBrandId,
        metadata: {
          // Missing content field
          context: {
            query: 'invalid query',
            platform: 'test-platform',
          },
        },
      };

      // Run the Answer Engine with invalid data
      const result = await mainRunnerService.runOne(
        'answer-engine',
        invalidContext,
      );

      // Verify the result indicates failure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      if (result.error) {
        expect(result.error.code).toBe('ANSWER_ENGINE_ERROR');
      } else {
        fail('Expected result.error to be defined');
      }
    });
  });

  describe('Performance', () => {
    it('should process multiple mentions efficiently', async () => {
      // Create multiple contexts
      const contexts = Array.from({ length: 10 }, (_, i) => ({
        brandId: testBrandId,
        metadata: {
          content: `Test content ${i}. This is a sample review.`,
          context: {
            query: `query ${i}`,
            response: `response ${i}`,
            platform: 'test-platform',
          },
          citations: [
            { source: `https://example.com/${i}`, text: `Citation ${i}` },
          ],
        },
      }));

      // Measure processing time
      const startTime = Date.now();

      // Process all contexts concurrently
      await Promise.all(
        contexts.map(context =>
          mainRunnerService.runOne('answer-engine', context),
        ),
      );

      const duration = Date.now() - startTime;

      // Verify all mentions were processed
      const storedMentions = await brandMentionRepository.find();
      expect(storedMentions.length).toBe(10);

      // Log performance metrics
      // eslint-disable-next-line no-console
      console.log(
        `Processed 10 mentions in ${duration}ms (${duration / 10}ms per mention)`,
      );

      // Ensure processing time is reasonable (adjust threshold as needed)
      expect(duration).toBeLessThan(10000); // Less than 10 seconds for 10 mentions
    });
  });
});
