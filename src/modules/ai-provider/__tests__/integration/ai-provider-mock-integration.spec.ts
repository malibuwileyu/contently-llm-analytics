import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
});

// Create a logger for tests
const logger = new Logger('AIProviderMockIntegrationTest');

// Mock interfaces and types
enum ProviderType {
  OPENAI = 'openai',
  PERPLEXITY = 'perplexity',
  SERPAPI = 'serpapi',
}

enum OperationType {
  CHAT = 'chat',
  COMPLETE = 'complete',
  EMBED = 'embed',
  SEARCH = 'search',
}

// Mock AI Provider Runner
class MockAIProviderRunner {
  async run(context: {
    type: ProviderType;
    operation: OperationType;
    input: any;
    options?: Record<string, unknown>;
  }): Promise<any> {
    // Simulate OpenAI API response
    if (context.type === ProviderType.OPENAI) {
      if (context.operation === OperationType.CHAT) {
        // Check if this is a conversation generation request
        const isConversationRequest =
          typeof context.input === 'object' &&
          Array.isArray(context.input) &&
          context.input.some(
            item =>
              typeof item.content === 'string' &&
              (item.content.includes('conversation') ||
                item.content.includes('Generate a conversation')),
          );

        if (isConversationRequest) {
          // Return a properly formatted conversation with speaker prefixes
          return {
            data: {
              text: "Customer: Hello, I recently purchased the XYZ Smartphone Pro and I'm having an issue with the battery life.\nAgent: I'm sorry to hear that. Could you please provide more details about the battery issue you're experiencing?\nCustomer: It seems to drain very quickly, even when I'm not using it much.\nAgent: Thank you for that information. How long does the battery typically last for you?\nCustomer: Only about 4-5 hours, which is much less than advertised.\nAgent: I understand your frustration. Let me check if there are any known issues or updates that might help with this problem.",
              choices: [
                "Customer: Hello, I recently purchased the XYZ Smartphone Pro and I'm having an issue with the battery life.\nAgent: I'm sorry to hear that. Could you please provide more details about the battery issue you're experiencing?\nCustomer: It seems to drain very quickly, even when I'm not using it much.\nAgent: Thank you for that information. How long does the battery typically last for you?\nCustomer: Only about 4-5 hours, which is much less than advertised.\nAgent: I understand your frustration. Let me check if there are any known issues or updates that might help with this problem.",
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
        } else {
          // Return a standard review response
          return {
            data: {
              text: "I recently purchased the new XYZ Smartphone Pro, and I'm thoroughly impressed with its performance. The camera quality is exceptional, capturing detailed photos even in low light conditions. The battery life is outstanding, easily lasting a full day with heavy use. The display is vibrant and responsive, making everything from browsing to gaming a pleasure. The only minor drawback is that it heats up slightly during intensive tasks. Overall, I would rate it 9/10 and highly recommend it to anyone looking for a premium smartphone experience.",
              choices: [
                "I recently purchased the new XYZ Smartphone Pro, and I'm thoroughly impressed with its performance. The camera quality is exceptional, capturing detailed photos even in low light conditions. The battery life is outstanding, easily lasting a full day with heavy use. The display is vibrant and responsive, making everything from browsing to gaming a pleasure. The only minor drawback is that it heats up slightly during intensive tasks. Overall, I would rate it 9/10 and highly recommend it to anyone looking for a premium smartphone experience.",
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
      } else if (context.operation === OperationType.EMBED) {
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
              promptTokens: 25,
              totalTokens: 25,
            },
          },
        };
      }
    }

    throw new Error(
      `Unsupported provider type or operation: ${context.type} - ${context.operation}`,
    );
  }
}

// Mock Answer Engine Runner
class MockAnswerEngineRunner {
  async run(context: {
    brandId: string;
    metadata?: Record<string, unknown>;
  }): Promise<any> {
    return {
      success: true,
      data: {
        mention: {
          id: 'mock-mention-id',
          content: context.metadata?.content,
          analysis: {
            sentiment: 'positive',
            score: 0.85,
            topics: [
              'smartphone',
              'camera',
              'battery',
              'display',
              'performance',
            ],
            entities: ['XYZ Smartphone Pro'],
            keywords: [
              'impressed',
              'exceptional',
              'outstanding',
              'vibrant',
              'responsive',
            ],
          },
        },
        health: {
          score: 85,
          trends: {
            sentiment: 'improving',
            engagement: 'stable',
          },
        },
      },
    };
  }
}

// Mock Conversation Explorer Runner
class MockConversationExplorerRunner {
  async analyzeConversation(data: {
    brandId: string;
    conversationId: string;
    messages: Array<{ role: string; content: string }>;
  }): Promise<any> {
    return {
      id: data.conversationId,
      messages: data.messages,
      analysis: {
        intents: [
          { category: 'inquiry', confidence: 0.9 },
          { category: 'feedback', confidence: 0.7 },
        ],
        sentiment: {
          score: 0.7,
          progression: 0.1,
          aspects: [
            { aspect: 'product', score: 0.8 },
            { aspect: 'service', score: 0.6 },
          ],
        },
        topics: [
          { name: 'smartphone features', relevance: 0.9 },
          { name: 'customer service', relevance: 0.7 },
          { name: 'pricing', relevance: 0.5 },
        ],
        actions: [{ type: 'follow-up', confidence: 0.8 }],
      },
    };
  }
}

describe('AI Provider Integration with Mocks', () => {
  let aiProviderRunner: MockAIProviderRunner;
  let answerEngineRunner: MockAnswerEngineRunner;
  let conversationExplorerRunner: MockConversationExplorerRunner;
  const apiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    // Skip tests if no API key
    if (!apiKey) {
      logger.warn(
        'No OPENAI_API_KEY found in environment, skipping integration tests',
      );
      return;
    }

    aiProviderRunner = new MockAIProviderRunner();
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

      const aiResult = await aiProviderRunner.run({
        type: ProviderType.OPENAI,
        operation: OperationType.CHAT,
        input: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        options: {
          temperature: 0.7,
          maxTokens: 150,
        },
      });

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
              _metadata: {
                provider: 'OpenAI',
                model: 'gpt-3.5-turbo',
              },
            },
          ],
        },
      });

      expect(answerResult).toBeDefined();
      expect(answerResult.success).toBe(true);
      expect(answerResult.data).toBeDefined();
      expect(answerResult.data.mention).toBeDefined();
      expect(answerResult.data.mention.analysis).toBeDefined();
      expect(answerResult.data.mention.analysis.sentiment).toBe('positive');
      expect(answerResult.data.mention.analysis.topics).toContain('smartphone');
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
        'Generate a conversation between a customer and support agent about a billing issue';

      const aiResult = await aiProviderRunner.run({
        type: ProviderType.OPENAI,
        operation: OperationType.CHAT,
        input: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        options: {
          temperature: 0.7,
          maxTokens: 250,
        },
      });

      expect(aiResult).toBeDefined();
      expect(aiResult.data).toBeDefined();
      expect(aiResult.data.text).toBeDefined();
      expect(typeof aiResult.data.text).toBe('string');

      // Parse the conversation into messages
      // For this test, we'll just split by newlines and assume alternating speakers
      const conversationText = aiResult.data.text;
      const lines = conversationText
        .split('\n')
        .filter((line: string) => line.trim().length > 0);

      const messages: Array<{ role: string; content: string }> = [];
      let currentSpeaker = 'customer';

      for (const line of lines) {
        if (line.includes(':')) {
          const [speaker, text] = line.split(':', 2);
          messages.push({
            role: speaker.toLowerCase().includes('customer')
              ? 'customer'
              : 'agent',
            content: text.trim(),
          });
        } else if (line.trim().length > 0) {
          messages.push({
            role: currentSpeaker,
            content: line.trim(),
          });
          // Toggle speaker for next line without speaker prefix
          currentSpeaker = currentSpeaker === 'customer' ? 'agent' : 'customer';
        }
      }

      // Then, use Conversation Explorer to analyze the conversation
      const explorerResult =
        await conversationExplorerRunner.analyzeConversation({
          brandId: 'test-brand',
          conversationId: 'test-conversation',
          messages: messages,
        });

      expect(explorerResult).toBeDefined();
      expect(explorerResult.id).toBeDefined();
      expect(explorerResult.analysis).toBeDefined();
      expect(explorerResult.analysis.intents).toBeDefined();
      expect(explorerResult.analysis.sentiment).toBeDefined();
      expect(explorerResult.analysis.topics).toBeDefined();
    });
  });

  describe('End-to-end workflow', () => {
    it('should process a complete workflow from AI generation to analysis', async () => {
      // Skip if no API key
      if (!apiKey) {
        logger.warn('No OPENAI_API_KEY found in environment, skipping test');
        return;
      }

      // 1. Generate a customer review using OpenAI
      const reviewPrompt =
        'Generate a detailed customer review about a new smartphone';

      const reviewResult = await aiProviderRunner.run({
        type: ProviderType.OPENAI,
        operation: OperationType.CHAT,
        input: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: reviewPrompt },
        ],
        options: {
          temperature: 0.7,
          maxTokens: 200,
        },
      });

      const reviewText = reviewResult.data.text;
      expect(reviewText).toBeDefined();

      // 2. Analyze the review with Answer Engine
      const answerResult = await answerEngineRunner.run({
        brandId: 'test-brand',
        metadata: {
          content: reviewText,
          context: {
            source: 'review',
            platform: 'test',
          },
        },
      });

      expect(answerResult.success).toBe(true);
      expect(answerResult.data.mention).toBeDefined();

      // 3. Generate a customer support conversation using OpenAI
      const conversationPrompt =
        'Generate a conversation between a customer and support agent about the following review: ' +
        reviewText.substring(0, 100);

      const conversationResult = await aiProviderRunner.run({
        type: ProviderType.OPENAI,
        operation: OperationType.CHAT,
        input: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: conversationPrompt },
        ],
        options: {
          temperature: 0.7,
          maxTokens: 300,
        },
      });

      const conversationText = conversationResult.data.text;
      expect(conversationText).toBeDefined();

      // Parse the conversation into messages
      const lines = conversationText
        .split('\n')
        .filter((line: string) => line.trim().length > 0);

      const messages: Array<{
        role: string;
        content: string;
        timestamp?: Date;
      }> = [];
      for (const line of lines) {
        if (line.includes(':')) {
          const [speaker, text] = line.split(':', 2);
          const role = speaker.toLowerCase().includes('customer')
            ? 'user'
            : 'assistant';
          messages.push({
            role: role,
            content: text.trim(),
            timestamp: new Date(),
          });
        }
      }

      expect(messages.length).toBeGreaterThan(0);

      // 4. Analyze the conversation with Conversation Explorer
      const explorerResult =
        await conversationExplorerRunner.analyzeConversation({
          brandId: 'test-brand',
          conversationId: 'test-conversation',
          messages: messages,
        });

      expect(explorerResult).toBeDefined();
      expect(explorerResult.analysis).toBeDefined();

      // 5. Generate embeddings for the review using OpenAI
      const embeddingResult = await aiProviderRunner.run({
        type: ProviderType.OPENAI,
        operation: OperationType.EMBED,
        input: reviewText,
        options: {
          model: 'text-embedding-ada-002',
        },
      });

      expect(embeddingResult).toBeDefined();
      expect(embeddingResult.data).toBeDefined();
      expect(embeddingResult.data.embedding).toBeDefined();
      expect(Array.isArray(embeddingResult.data.embedding)).toBe(true);

      // Complete workflow test passed
    });
  });
});
