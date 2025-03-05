import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AIProviderModule } from '../src/ai-provider/ai-provider.module';
import { AIProviderRunner } from '../src/ai-provider/ai-provider.runner';
import { ProviderType } from '../src/ai-provider/ai-provider.interface';

describe('LLM Search Visibility (e2e)', () => {
  let app: INestApplication;
  let aiRunner: AIProviderRunner;
  const outputDir = path.join(__dirname, 'output');
  const outputFile = path.join(outputDir, 'llm-visibility-results.txt');
  const questionsFile = path.join(outputDir, 'generated-questions.json');
  let testResults: TestResults;
  let questions: string[] = [];

  beforeAll(async () => {
    // Load pre-generated questions
    if (!fs.existsSync(questionsFile)) {
      throw new Error(
        'Please run generate-questions.ts first to create the questions file',
      );
    }
    questions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              ai: {
                openai: {
                  apiKey: process.env.OPENAI_API_KEY,
                  defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4',
                  timeout: 60000, // 1 minute timeout per question
                  maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
                },
              },
            }),
          ],
        }),
        AIProviderModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    aiRunner = app.get<AIProviderRunner>(AIProviderRunner);
    await app.init();

    // Initialize test results
    testResults = {
      timestamp: new Date().toISOString(),
      brandName: 'Nike',
      queries: [],
    };
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    // Write final results to file
    fs.writeFileSync(outputFile, JSON.stringify(testResults, null, 2), 'utf8');
  });

  it('should analyze brand visibility for all queries', async () => {
    const brandName = 'Nike';

    // Process each question
    for (let i = 0; i < questions.length; i++) {
      const query = questions[i];
      console.log(`Processing query ${i + 1} of ${questions.length}: ${query}`);

      // 1. Get initial response
      const response = await aiRunner.run(ProviderType.OPENAI, 'chat', [
        {
          role: 'system',
          content:
            'You are a helpful assistant providing factual information about athletic wear and brands.',
        },
        { role: 'user', content: query },
      ]);

      // 2. Analyze brand presence
      const analysisPrompt = `
      Analyze the following response for ${brandName}'s brand visibility:
      
      ${response.content}
      
      Provide:
      1. Brand mention position
      2. Total mentions
      3. Sentiment analysis
      4. Competitor comparison
      5. Category relevance score (0-1)
      `;

      const analysis = await aiRunner.run(ProviderType.OPENAI, 'chat', [
        {
          role: 'system',
          content:
            'You are a brand analysis expert. Provide detailed, quantitative analysis.',
        },
        { role: 'user', content: analysisPrompt },
      ]);

      const queryAnalysis: QueryAnalysis = {
        query,
        response: {
          content: response.content,
          metadata: response.metadata,
        },
        analysis: {
          content: analysis.content,
          metadata: analysis.metadata,
        },
      };

      // Add to results and write to file after each query
      testResults.queries.push(queryAnalysis);
      fs.writeFileSync(
        outputFile,
        JSON.stringify(testResults, null, 2),
        'utf8',
      );

      // Assertions
      expect(response.content).toBeDefined();
      expect(analysis.content).toBeDefined();
    }
  }, 7200000); // 2 hours timeout for all queries
});
