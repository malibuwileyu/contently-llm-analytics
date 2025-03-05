import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderModule } from '../src/modules/ai-provider/ai-provider.module';
import { AIProviderRunner } from '../src/modules/ai-provider/runners/ai-provider.runner';
import { ProviderType } from '../src/modules/ai-provider/interfaces/ai-provider.interface';
import * as fs from 'fs';
import * as path from 'path';

async function generateQuestionBatch(
  aiRunner: AIProviderRunner,
  batchSize: number,
  existingQuestions: string[] = [],
): Promise<string[]> {
  const categories = [
    'athletic shoes',
    'running shoes',
    'sports shoes',
    'athletic wear',
    'sportswear',
    'activewear',
    'sports equipment',
    'fitness gear',
    'workout gear',
    'sports apparel',
    'training equipment',
    'athletic accessories',
  ];

  const prompt = `Generate ${batchSize} unique, natural-sounding questions about athletic brands and products. 
  The questions should focus on these categories: ${categories.join(', ')}.
  
  Rules:
  1. Each question should be natural and varied in structure
  2. Include questions about market share, popularity, quality, innovation, and trends
  3. Some questions should target specific demographics (men, women, kids, athletes, etc.)
  4. Some questions should include temporal aspects (2024, 2025, current trends, etc.)
  5. No question should be similar to these existing questions: ${existingQuestions.join(', ')}
  6. Each question should be on a new line
  7. Don't number the questions
  8. Questions should be relevant for brand visibility analysis
  
  Format the output as a JSON array of strings.`;

  const response = await aiRunner.run(ProviderType.OPENAI, 'chat', [
    {
      role: 'system',
      content:
        'You are a market research expert creating questions for brand visibility analysis.',
    },
    { role: 'user', content: prompt },
  ]);

  return JSON.parse(response.content);
}

async function generateAllQuestions() {
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
                timeout: 60000, // 1 minute timeout per batch
                maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3'),
              },
            },
          }),
        ],
      }),
      AIProviderModule,
    ],
  }).compile();

  const app = moduleFixture.createNestApplication();
  const aiRunner = app.get<AIProviderRunner>(AIProviderRunner);
  await app.init();

  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const totalQuestions = 100;
  const batchSize = 20;
  let allQuestions: string[] = [];

  try {
    for (let i = 0; i < totalQuestions / batchSize; i++) {
      console.log(
        `Generating batch ${i + 1} of ${totalQuestions / batchSize}...`,
      );
      const newQuestions = await generateQuestionBatch(
        aiRunner,
        batchSize,
        allQuestions,
      );
      allQuestions = [...allQuestions, ...newQuestions];

      // Save progress after each batch
      fs.writeFileSync(
        path.join(outputDir, 'generated-questions.json'),
        JSON.stringify(allQuestions, null, 2),
        'utf8',
      );
      console.log(
        `Batch ${i + 1} complete. Total questions so far: ${allQuestions.length}`,
      );

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    // Save whatever questions we have so far
    if (allQuestions.length > 0) {
      fs.writeFileSync(
        path.join(outputDir, 'generated-questions.json'),
        JSON.stringify(allQuestions, null, 2),
        'utf8',
      );
    }
    throw error;
  } finally {
    await app.close();
  }

  return allQuestions;
}

// Run the generator
generateAllQuestions()
  .then(() => {
    console.log('All questions generated successfully!');
  })
  .catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
  });
