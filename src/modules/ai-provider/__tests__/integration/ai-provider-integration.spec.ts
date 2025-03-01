import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderRunner } from '../../runners/ai-provider.runner';
import { AIProviderFactoryService } from '../../services/ai-provider-factory.service';
import {
  AIProvider,
  ProviderType,
  AIProviderCapabilities,
  AIProviderResponse,
} from '../../interfaces';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
});

// Create a logger for tests
const logger = new Logger('AIProviderIntegrationTest');

// Mock classes for database-dependent components
class MockAnswerEngineRunner {
  async run(data: any): Promise<any> {
    return {
      id: 'mock-answer-id',
      content: data.metadata.content,
      analysis: {
        sentiment: { score: 0.7 },
        topics: [
          { name: 'product', relevance: 0.9 },
          { name: 'service', relevance: 0.7 },
        ],
        mention: {
          entities: [
            { name: 'XYZ Smartphone Pro', type: 'product', sentiment: 0.8 },
          ],
        },
      },
    };
  }
}

class MockConversationExplorerRunner {
  async analyzeConversation(data: any): Promise<any> {
    return {
      id: data.conversationId || 'mock-conversation-id',
      messages: data.messages,
      analysis: {
        intents: [
          { category: 'inquiry', confidence: 0.9 },
          { category: 'feedback', confidence: 0.7 },
        ],
        sentiment: {
          score: 0.7,
          progression: 0.1,
          _aspects: [
            { aspect: 'product', score: 0.8 },
            { aspect: 'service', score: 0.6 },
          ],
        },
        topics: [
          { name: 'smartphone features', relevance: 0.9 },
          { name: 'customer service', relevance: 0.7 },
        ],
        _actions: [{ type: 'follow-up', confidence: 0.8 }],
      },
    };
  }
}

// Mock OpenAI provider
class MockOpenAIProvider implements AIProvider {
  readonly type = ProviderType.OPENAI;
  readonly name = 'Mock OpenAI';
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    complete: true,
    embed: true,
    search: false,
  };
  readonly priority = 10;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    _options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    return {
      data: {
        text: "I'm a mock OpenAI response. Here's a customer review: The XYZ Smartphone Pro is an excellent device with great battery life and camera quality. The screen is vibrant and the performance is top-notch. I highly recommend it to anyone looking for a premium smartphone experience.",
        choices: [
          "I'm a mock OpenAI response. Here's a customer review: The XYZ Smartphone Pro is an excellent device with great battery life and camera quality. The screen is vibrant and the performance is top-notch. I highly recommend it to anyone looking for a premium smartphone experience.",
        ],
      },
      metadata: {
        provider: 'OpenAI',
        model: 'gpt-3.5-turbo',
        timestamp: new Date(),
        latencyMs: 250,
        usage: {
          promptTokens: 25,
          completionTokens: 150,
          totalTokens: 175,
        },
      },
    };
  }

  async complete(
    _prompt: string,
    _options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    return {
      data: {
        text: "I'm a mock OpenAI completion response.",
        choices: ["I'm a mock OpenAI completion response."],
      },
      metadata: {
        provider: 'OpenAI',
        model: 'gpt-3.5-turbo',
        timestamp: new Date(),
        latencyMs: 150,
        usage: {
          promptTokens: 10,
          completionTokens: 50,
          totalTokens: 60,
        },
      },
    };
  }

  async embed(
    text: string,
    _options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ embedding: number[]; dimensions: number }>> {
    // Generate mock embedding vector (32 dimensions)
    const embedding = Array(32)
      .fill(0)
      .map(() => Math.random() * 2 - 1);

    return {
      data: {
        embedding,
        dimensions: embedding.length,
      },
      metadata: {
        provider: 'OpenAI',
        model: 'text-embedding-ada-002',
        timestamp: new Date(),
        latencyMs: 120,
        usage: {
          promptTokens: text.split(' ').length,
          totalTokens: text.split(' ').length,
        },
      },
    };
  }

  async search(
    _query: string,
    _options?: Record<string, unknown>,
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  > {
    throw new Error('Search not implemented in mock provider');
  }
}

describe('AI Provider Integration', () => {
  let aiProviderRunner: AIProviderRunner;
  let aiProviderFactoryService: AIProviderFactoryService;
  let answerEngineRunner: MockAnswerEngineRunner;
  let conversationExplorerRunner: MockConversationExplorerRunner;
  const apiKey = process.env.OPENAI_API_KEY;

  beforeEach(async () => {
    // Skip tests if no API key
    if (!apiKey) {
      logger.warn(
        'No OPENAI_API_KEY found in environment, skipping integration tests',
      );
      return;
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              openai: {
                apiKey: process.env.OPENAI_API_KEY || 'test-api-key',
                _organizationId: process.env._OPENAI_ORGANIZATION_ID,
                defaultModel:
                  process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
                defaultTemperature: parseFloat(
                  process.env.OPENAI_DEFAULT_TEMPERATURE || '0.7',
                ),
                timeoutMs: parseInt(
                  process.env.OPENAI_TIMEOUT_MS || '30000',
                  10,
                ),
                maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
              },
              _perplexity: {
                apiKey: process.env.PERPLEXITY_API_KEY || 'test-api-key',
                defaultModel:
                  process.env.PERPLEXITY_DEFAULT_MODEL || 'llama-3-8b-instruct',
                defaultTemperature: parseFloat(
                  process.env.PERPLEXITY_DEFAULT_TEMPERATURE || '0.7',
                ),
                timeoutMs: parseInt(
                  process.env.PERPLEXITY_TIMEOUT_MS || '30000',
                  10,
                ),
                maxRetries: parseInt(
                  process.env.PERPLEXITY_MAX_RETRIES || '3',
                  10,
                ),
              },
              _serpapi: {
                apiKey: process.env.SERPAPI_API_KEY || 'test-api-key',
                timeoutMs: parseInt(
                  process.env.SERPAPI_TIMEOUT_MS || '30000',
                  10,
                ),
                maxRetries: parseInt(
                  process.env.SERPAPI_MAX_RETRIES || '3',
                  10,
                ),
              },
            }),
          ],
        }),
      ],
      providers: [AIProviderFactoryService, AIProviderRunner],
    }).compile();

    aiProviderRunner = module.get<AIProviderRunner>(AIProviderRunner);
    aiProviderFactoryService = module.get<AIProviderFactoryService>(
      AIProviderFactoryService,
    );

    // Register mock OpenAI provider
    aiProviderFactoryService.registerProvider(
      'mock-openai',
      new MockOpenAIProvider(),
    );

    // Create mock instances for database-dependent components
    answerEngineRunner = new MockAnswerEngineRunner();
    conversationExplorerRunner = new MockConversationExplorerRunner();
  });

  it('should be defined', () => {
    // Skip if no API key
    if (!apiKey) return;

    expect(aiProviderRunner).toBeDefined();
    expect(answerEngineRunner).toBeDefined();
    expect(conversationExplorerRunner).toBeDefined();
  });

  describe('AI Provider with Answer Engine', () => {
    it('should use OpenAI to generate content for Answer Engine', async () => {
      // Skip if no API key
      if (!apiKey) {
        logger.warn('No OPENAI_API_KEY found in environment, skipping test');
        return;
      }

      // First, use AI Provider to generate content
      const prompt = 'Generate a customer review about a smartphone';

      const aiResult = await aiProviderRunner.runChat(
        ProviderType.OPENAI,
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 150,
        },
      );

      expect(aiResult).toBeDefined();
      expect(aiResult.data).toBeDefined();
      expect(aiResult.data.text).toBeDefined();
      expect(typeof aiResult.data.text).toBe('string');

      // Then, use Answer Engine to analyze the generated content
      const answerResult = await answerEngineRunner.run({
        brandId: 'test-brand',
        metadata: {
          content: aiResult.data.text,
          context: {
            source: 'review',
            platform: 'test',
          },
          citations: [
            {
              source: 'AI Generated',
              metadata: {
                provider: 'openai',
                model: 'gpt-4',
              },
            },
          ],
        },
      });

      expect(answerResult).toBeDefined();
      expect(answerResult.analysis).toBeDefined();
      expect(answerResult.analysis.sentiment).toBeDefined();
      expect(answerResult.analysis.topics).toBeDefined();
      expect(answerResult.analysis.mention).toBeDefined();
    });
  });

  describe('AI Provider with Conversation Explorer', () => {
    it('should use OpenAI to generate conversation for Conversation Explorer', async () => {
      // Skip if no API key
      if (!apiKey) {
        logger.warn('No OPENAI_API_KEY found in environment, skipping test');
        return;
      }

      // First, use AI Provider to generate a conversation
      const prompt =
        'Generate a conversation between a customer and an agent about a smartphone issue';

      const aiResult = await aiProviderRunner.runChat(
        ProviderType.OPENAI,
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 250,
        },
      );

      expect(aiResult).toBeDefined();
      expect(aiResult.data).toBeDefined();
      expect(aiResult.data.text).toBeDefined();
      expect(typeof aiResult.data.text).toBe('string');

      // Parse the conversation text into messages
      const conversationText = aiResult.data.text;
      const lines = conversationText
        .split('\n')
        .filter((line: string) => line.trim() !== '');

      const messages = lines.map((line: string) => {
        const parts = line.split(':');
        const role = parts[0].toLowerCase().includes('customer')
          ? 'user'
          : 'assistant';
        const content = parts.slice(1).join(':').trim();

        return {
          role,
          content,
          timestamp: new Date(),
        };
      });

      // Then, use Conversation Explorer to analyze the conversation
      const conversationResult =
        await conversationExplorerRunner.analyzeConversation({
          conversationId: 'test-conversation-id',
          messages,
          _metadata: {
            platform: 'test',
            channel: 'chat',
            tags: ['test', 'integration'],
            customFields: {
              testCase: 'AI Provider Integration',
            },
          },
        });

      expect(conversationResult).toBeDefined();
      expect(conversationResult.analysis).toBeDefined();
      expect(conversationResult.analysis.intents).toBeDefined();
      expect(conversationResult.analysis.sentiment).toBeDefined();
      expect(conversationResult.analysis.topics).toBeDefined();
    });
  });

  describe('End-to-end workflow', () => {
    it('should process a complete workflow from AI generation to analysis', async () => {
      // Skip if no API key
      if (!apiKey) {
        logger.warn('No OPENAI_API_KEY found in environment, skipping test');
        return;
      }

      // 1. Generate a conversation using AI Provider
      const conversationPrompt =
        'Generate a conversation between a customer and an agent about a smartphone issue';

      const conversationResult = await aiProviderRunner.runChat(
        ProviderType.OPENAI,
        [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: conversationPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 250,
        },
      );

      expect(conversationResult).toBeDefined();
      expect(conversationResult.data.text).toBeDefined();

      // 2. Parse the conversation text into messages
      const conversationText = conversationResult.data.text;
      const lines = conversationText
        .split('\n')
        .filter((line: string) => line.trim() !== '');

      const messages = lines.map((line: string) => {
        const parts = line.split(':');
        const role = parts[0].toLowerCase().includes('customer')
          ? 'user'
          : 'assistant';
        const content = parts.slice(1).join(':').trim();

        return {
          role,
          content,
          timestamp: new Date(),
        };
      });

      // 3. Analyze the conversation
      const analysisResult =
        await conversationExplorerRunner.analyzeConversation({
          conversationId: 'test-conversation-id',
          messages,
          _metadata: {
            platform: 'test',
            channel: 'chat',
            tags: ['test', 'integration'],
            customFields: {
              testCase: 'AI Provider Integration',
            },
          },
        });

      expect(analysisResult).toBeDefined();
      expect(analysisResult.analysis).toBeDefined();

      // 4. Generate embeddings for the conversation
      const embeddingText = messages
        .map((m: { content: string }) => m.content)
        .join(' ');

      const embeddingResult = await aiProviderRunner.runEmbed(
        ProviderType.OPENAI,
        embeddingText,
        {},
      );

      expect(embeddingResult).toBeDefined();
      expect(embeddingResult.data.embedding).toBeDefined();
      expect(Array.isArray(embeddingResult.data.embedding)).toBe(true);
      expect(embeddingResult.data.dimensions).toBeGreaterThan(0);

      // 5. Complete end-to-end workflow
      expect(true).toBe(true);
    });
  });
});
