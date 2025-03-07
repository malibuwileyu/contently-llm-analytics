import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { BrandVisibilityService } from '../../src/analytics/services/brand-visibility.service';
import { OpenAIProviderService } from '../../src/modules/ai-provider/services/openai-provider.service';
import { QuestionValidatorService } from '../../src/analytics/services/question-validator.service';
import { NLPService } from '../../src/modules/nlp/nlp.service';
import { CompetitorEntity } from '../../src/modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../../src/modules/brand-analytics/entities/industry.entity';
import { AIProviderModule } from '../../src/modules/ai-provider/ai-provider.module';
import * as fs from 'fs';
import * as path from 'path';
import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from '@jest/globals';
import { Repository } from 'typeorm';

const TEST_OUTPUT_FILE = 'visibility-test-results.json';

interface TestResult {
  config: {
    batchSize: number;
    maxConcurrent: number;
    totalTime: number;
    averageTimePerQuestion: number;
  };
  questions: string[];
  results: Array<{
    question: string;
    analysis: string;
    brandMentions?: Array<{
      brandId: string;
      position: {
        index: number;
        paragraph: number;
        isLeading: boolean;
      };
      visibility: {
        prominence: number;
        contextScore: number;
        competitorProximity: Array<{
          competitor: string;
          distance: number;
          relationship: string;
        }>;
      };
    }>;
    metrics?: {
      visibilityStats: {
        averagePosition: number;
        prominenceScore: number;
        leadingMentions: string;
        competitorCooccurrence: string;
      };
      llmPatterns?: {
        categoryLeadership: Record<string, string>;
      };
    };
    metadata: {
      processingTime: number;
      retryCount: number;
      timestamp: string;
    };
  }>;
}

const appendTestOutput = (data: Partial<TestResult>) => {
  const projectRoot = path.resolve(__dirname, '../../');
  const outputDir = path.join(projectRoot, 'test-outputs');
  const outputPath = path.join(outputDir, TEST_OUTPUT_FILE);

  console.log('Project root:', projectRoot);
  console.log('Writing to directory:', outputDir);
  console.log('Full output path:', outputPath);

  if (!fs.existsSync(outputDir)) {
    console.log('Creating directory:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Create a more concise output
  const conciseData = {
    config: data.config,
    questions: data.questions,
    results: data.results?.map(r => ({
      question: r.question,
      analysis: r.analysis,
      brandMentions: r.brandMentions?.map(m => ({
        brandId: m.brandId,
        position: m.position,
        visibility: m.visibility,
      })),
      metrics: {
        visibilityStats: r.metrics?.visibilityStats,
        categoryLeadership: r.metrics?.llmPatterns?.categoryLeadership,
      },
      metadata: r.metadata,
    })),
  };

  console.log('Writing file...');
  fs.writeFileSync(outputPath, JSON.stringify(conciseData, null, 2));
  console.log('File written successfully');

  // Verify file exists
  if (fs.existsSync(outputPath)) {
    console.log('File exists after writing');
    const stats = fs.statSync(outputPath);
    console.log('File size:', stats.size);
  } else {
    console.log('File does not exist after writing!');
  }
};

jest.setTimeout(600000);

describe('BrandVisibilityService - Batch Processing', () => {
  let module: TestingModule;
  let service: BrandVisibilityService;
  let validator: QuestionValidatorService;
  let openAIProvider: OpenAIProviderService;
  let testIndustry: IndustryEntity;
  let testCompany: CompetitorEntity;

  const mockOpenAIProvider = {
    complete: jest.fn(),
  };

  const mockQuestionValidator: Partial<QuestionValidatorService> = {
    validateQuestions: jest.fn().mockImplementation((questions: string[]) => {
      return Promise.resolve(
        questions.map(q => ({
          question: q,
          isRelevant: true,
          relevanceScore: 0.9,
          category: 'brand-visibility',
          isBrandAgnostic: true,
        })),
      );
    }),
  };

  const mockNLPService = {
    analyzeBrand: jest.fn(),
  };

  beforeEach(async () => {
    // Ensure test-outputs directory exists
    const outputDir = path.join(process.cwd(), 'test-outputs');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Clear the test output file
    const outputPath = path.join(outputDir, TEST_OUTPUT_FILE);
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [CompetitorEntity, IndustryEntity],
          synchronize: true,
          dropSchema: true,
          logging: false,
        }),
        TypeOrmModule.forFeature([CompetitorEntity, IndustryEntity]),
        AIProviderModule,
      ],
      providers: [
        BrandVisibilityService,
        {
          provide: OpenAIProviderService,
          useValue: mockOpenAIProvider,
        },
        {
          provide: QuestionValidatorService,
          useValue: mockQuestionValidator,
        },
        {
          provide: NLPService,
          useValue: mockNLPService,
        },
      ],
    }).compile();

    service = module.get<BrandVisibilityService>(BrandVisibilityService);
    validator = module.get<QuestionValidatorService>(QuestionValidatorService);
    openAIProvider = module.get<OpenAIProviderService>(OpenAIProviderService);

    // Create test industry
    testIndustry = new IndustryEntity();
    testIndustry.id = 'test-industry-1';
    testIndustry.name = 'Athletic Footwear & Apparel';
    testIndustry.description = 'Athletic footwear and apparel industry';

    // Create test company
    testCompany = new CompetitorEntity();
    testCompany.id = 'test-company-1';
    testCompany.name = 'Nike';
    testCompany.website = 'nike.com';
    testCompany.description = 'Global leader in athletic footwear and apparel';
    testCompany.alternateNames = ['Nike Inc', 'Nike Corporation'];
    testCompany.keywords = ['nike', 'athletic', 'footwear', 'apparel'];
    testCompany.industry = testIndustry;
    testCompany.isCustomer = false;
    testCompany.isActive = true;
    testCompany.competitors = ['Adidas', 'Puma', 'Under Armour'];
    testCompany.regions = ['North America', 'Europe', 'Asia'];
    testCompany.settings = {
      industry: testIndustry.name,
      competitors: ['Adidas', 'Puma', 'Under Armour'],
      regions: ['North America', 'Europe', 'Asia'],
    };

    // Save test data
    const industryRepo = module.get(getRepositoryToken(IndustryEntity));
    const competitorRepo = module.get(getRepositoryToken(CompetitorEntity));

    await industryRepo.save(testIndustry);
    await competitorRepo.save(testCompany);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should process batch questions and output results to JSON', async () => {
    // Generate questions based on the competitor's industry
    const generateQuestionsPrompt = `
      Given the keyword below, first determine its broader category or industry. Then, generate a list of search queries that are likely to return results mentioning brands in this category—without explicitly including brand names themselves.

      The queries should reflect common ways users research products and services in this category, focusing on discovery and informational queries with five or more words.

      Focus on queries that will naturally lead to brand mentions, such as:
      - Best products/services for specific use cases
      - Recommendations for different user types
      - Top choices in different price ranges
      - Most reliable options in the category
      - Popular choices among specific demographics
      - Expert-recommended solutions in the field

      Examples of good queries:
      ❌ "What is Nike's market share in North America?"
      ✅ "Best running shoes for beginner marathon training"
      ❌ "How does Adidas compare to Nike?"
      ✅ "Most durable athletic wear for intense workouts"
      ❌ "Which brand has better brand recognition?"
      ✅ "What do professional athletes wear for training"

      Return the response strictly as a JSON array with no extra text or explanations.

      Keyword: ${testCompany.industry.name}
      Description: ${testCompany.description}
    `;

    let questions;
    try {
      console.log(
        'Generating questions for industry:',
        testCompany.industry.name,
      );
      const questionsResponse = await openAIProvider.complete(
        generateQuestionsPrompt,
      );
      console.log('Raw response:', questionsResponse.content);
      questions = JSON.parse(questionsResponse.content.trim());
      console.log('Generated questions:', questions);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Invalid questions format returned');
      }

      // Validate and filter questions
      console.log('Validating questions...');
      const validations = await validator.validateQuestions(questions);
      questions = validations
        .filter(v => v.isRelevant && v.category === 'brand-visibility')
        .map(v => v.suggestedRevision || v.question)
        .slice(0, 10); // Ensure we get exactly 10 questions

      if (questions.length < 10) {
        console.log('Not enough valid questions, using fallback questions...');
        // Fallback to default questions focused on natural search queries
        const fallbackQuestions = [
          'Best athletic shoes for long-distance running beginners',
          'Most comfortable workout clothes for high-intensity training',
          'What do professional athletes wear during training sessions',
          'Top rated running shoes under 150 dollars',
          'Most durable sportswear brands for everyday workouts',
          'Best athletic wear for professional marathon training',
          'Most recommended running shoes for cross-country',
          'What sportswear do Olympic athletes prefer',
          'Top athletic shoes for gym workouts and weightlifting',
          'Most popular athletic wear for college athletes',
        ];

        // Fill remaining slots with fallback questions
        const remainingSlots = 10 - questions.length;
        questions = [
          ...questions,
          ...fallbackQuestions.slice(0, remainingSlots),
        ];
      }

      console.log('Validated questions:', questions);
    } catch (error) {
      console.error('Error generating or validating questions:', error);
      // Fallback to default questions focused on natural search queries
      questions = [
        'Best athletic shoes for long-distance running beginners',
        'Most comfortable workout clothes for high-intensity training',
        'What do professional athletes wear during training sessions',
        'Top rated running shoes under 150 dollars',
        'Most durable sportswear brands for everyday workouts',
      ];
      console.log('Using fallback questions:', questions);
    }

    // Process the questions
    const startTime = Date.now();
    const results = await service.analyzeBrandVisibilityBatch(
      testCompany,
      questions,
      { maxConcurrent: 2 },
    );
    const endTime = Date.now();

    // Prepare output data
    const outputData: TestResult = {
      config: {
        batchSize: questions.length,
        maxConcurrent: 2,
        totalTime: endTime - startTime,
        averageTimePerQuestion: (endTime - startTime) / questions.length,
      },
      questions: questions,
      results: results,
    };

    // Save results to file
    appendTestOutput(outputData);

    // Verify results
    expect(results).toBeDefined();
    expect(results.length).toBe(questions.length);
    results.forEach((result, index) => {
      expect(result.question).toBe(questions[index]);
      expect(result.analysis).toBeDefined();
      expect(result.brandMentions).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.metadata).toBeDefined();
    });
  }, 600000);
});
