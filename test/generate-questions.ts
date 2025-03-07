import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderModule } from '../src/modules/ai-provider/ai-provider.module';
import { AIProviderRunner } from '../src/modules/ai-provider/runners/ai-provider.runner';
import { ProviderType } from '../src/modules/ai-provider/interfaces/ai-provider.interface';
import * as fs from 'fs';
import * as path from 'path';

async function generateQuestionBatch(
  aiRunner: AIProviderRunner,
  searchTerm: string,
  description?: string,
): Promise<string[]> {
  const prompt = `
    Given the keyword below, first determine its broader category or industry. Then, generate a list of search queries that are likely to return results mentioning the keyword—without explicitly including the keyword itself.

    The queries should reflect common ways users research entities in this category, focusing on discovery and informational queries with five or more words.

    Avoid queries that are too general (e.g., "How does [industry process] work?") or too specific to unrelated functions (e.g., "How do I reset my online banking password?").

    Return the response strictly as a JSON array with no extra text or explanations.

    Keyword: ${searchTerm}${description ? ` (Description: ${description})` : ''}
  `;

  const response = await aiRunner.run(ProviderType.OPENAI, 'chat', [
    {
      role: 'system',
      content: 'You are a market research expert creating search queries for brand visibility analysis.',
    },
    { role: 'user', content: prompt },
  ]);

  return JSON.parse(response.content.trim());
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

  const searchTerms = [
    { term: 'Nike', description: 'Global athletic footwear and apparel brand' },
    { term: 'Adidas', description: 'Sports and lifestyle brand' },
    { term: 'Under Armour', description: 'Performance apparel manufacturer' },
    { term: 'New Balance', description: 'Athletic footwear company' },
    { term: 'Puma', description: 'Sports lifestyle brand' }
  ];

  const allQueries: Record<string, string[]> = {};

  try {
    for (const { term, description } of searchTerms) {
      console.log(`Generating queries for ${term}...`);
      const queries = await generateQuestionBatch(aiRunner, term, description);
      allQueries[term] = queries;

      // Save progress after each term
      fs.writeFileSync(
        path.join(outputDir, 'generated-queries.json'),
        JSON.stringify(allQueries, null, 2),
        'utf8'
      );
      console.log(`Generated ${queries.length} queries for ${term}`);

      // Small delay between terms
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error('Error generating queries:', error);
    // Save whatever queries we have so far
    if (Object.keys(allQueries).length > 0) {
      fs.writeFileSync(
        path.join(outputDir, 'generated-queries.json'),
        JSON.stringify(allQueries, null, 2),
        'utf8'
      );
    }
    throw error;
  } finally {
    await app.close();
  }

  return allQueries;
}

// Run the generator
generateAllQuestions()
  .then(() => {
    console.log('All queries generated successfully!');
  })
  .catch(error => {
    console.error('Error in main process:', error);
    process.exit(1);
  });
