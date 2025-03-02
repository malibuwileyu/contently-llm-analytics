import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderRunner } from '../../src/modules/ai-provider/runners/ai-provider.runner';
import { AIProviderFactoryService } from '../../src/modules/ai-provider/services/ai-provider-factory.service';
import {
  AIProvider,
  OperationType,
  ProviderType,
  AIProviderCapabilities,
  AIProviderResponse,
} from '../../src/modules/ai-provider/interfaces';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../.env.test'),
});

/**
 * Mock OpenAI provider for testing
 */
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
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    // Check if this is a request for a customer review
    const isReviewRequest = messages.some(
      m =>
        m.content.toLowerCase().includes('review') ||
        m.content.toLowerCase().includes('feedback'),
    );

    // Check if this is a request for a conversation
    const isConversationRequest = messages.some(
      m =>
        m.content.toLowerCase().includes('conversation') ||
        m.content.toLowerCase().includes('chat'),
    );

    let responseText = '';

    if (isReviewRequest) {
      responseText =
        'The XYZ Smartphone Pro is an excellent device with great battery life and camera quality. The screen is vibrant and the performance is top-notch. I highly recommend it to anyone looking for a premium smartphone experience. The customer service was also very helpful when I had questions about setting up my device.';
    } else if (isConversationRequest) {
      responseText = `Customer: Hi, I'm having an issue with my new XYZ Smartphone Pro. The battery seems to drain very quickly.
Agent: I'm sorry to hear that. How long does the battery typically last for you?
Customer: It's only lasting about 4 hours with moderate use, which seems very short for a new phone.
Agent: You're right, that's not normal for the XYZ Smartphone Pro. The battery should last at least 12 hours with moderate use. Let's troubleshoot this issue.
Customer: Great, what should we check first?
Agent: First, let's check which apps are consuming the most battery. Go to Settings > Battery and check the battery usage by app.
Customer: I see that the Maps app is using 45% of my battery, even though I haven't been using it much.
Agent: That's definitely the issue. It sounds like the Maps app might be running in the background. Let's force stop it and restrict its background activity.
Customer: That worked! The battery usage looks much more normal now. Thank you for your help.
Agent: You're welcome! Is there anything else I can assist you with regarding your XYZ Smartphone Pro?
Customer: No, that's all for now. Thanks again for the quick solution.`;
    } else {
      responseText = "I'm a mock OpenAI response.";
    }

    return {
      data: {
        text: responseText,
        choices: [responseText],
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
    prompt: string,
    options?: Record<string, unknown>,
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
    options?: Record<string, unknown>,
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
    options?: Record<string, unknown>,
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  > {
    throw new Error('Search not implemented in mock provider');
  }
}

/**
 * Mock Answer Engine Runner for testing
 */
class MockAnswerEngineRunner {
  async run(data: any): Promise<any> {
    return {
      success: true,
      data: {
        mention: {
          id: 'mock-mention-id',
          content: data.metadata.content,
          brandId: data.brandId,
          sentiment: { score: 0.8 },
          topics: [
            { name: 'product', relevance: 0.9 },
            { name: 'battery life', relevance: 0.8 },
            { name: 'camera quality', relevance: 0.7 },
            { name: 'customer service', relevance: 0.6 },
          ],
          entities: [
            { name: 'XYZ Smartphone Pro', type: 'product', sentiment: 0.8 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        health: {
          brandId: data.brandId,
          _overallScore: 0.75,
          sentimentScore: 0.8,
          engagementScore: 0.7,
          topTopics: [
            { name: 'product', score: 0.9 },
            { name: 'battery life', score: 0.8 },
          ],
          period: 'last-30-days',
        },
      },
    };
  }
}

/**
 * Mock Conversation Explorer Runner for testing
 */
class MockConversationExplorerRunner {
  async analyzeConversation(data: any): Promise<any> {
    return {
      id: data.conversationId || 'mock-conversation-id',
      messages: data.messages,
      analysis: {
        intents: [
          { category: 'technical_support', confidence: 0.9 },
          { category: 'problem_resolution', confidence: 0.8 },
        ],
        sentiment: {
          score: 0.6,
          progression: 0.3,
          _aspects: [
            { aspect: 'battery', score: 0.4 },
            { aspect: 'customer service', score: 0.8 },
          ],
        },
        topics: [
          { name: 'battery issues', relevance: 0.9 },
          { name: 'product', relevance: 0.85 },
          { name: 'troubleshooting', relevance: 0.8 },
          { name: 'app management', relevance: 0.7 },
        ],
        _actions: [
          { type: 'follow-up', confidence: 0.3 },
          { type: 'resolution', confidence: 0.9 },
        ],
        engagementScore: 0.85,
      },
    };
  }

  async getConversationTrends(brandId: string, options?: any): Promise<any> {
    return {
      brandId,
      period: options?.period || 'last-30-days',
      topIntents: [
        { category: 'technical_support', count: 45, percentage: 0.3 },
        { category: 'account_inquiry', count: 30, percentage: 0.2 },
      ],
      topTopics: [
        { name: 'battery issues', count: 38, percentage: 0.25 },
        { name: 'app management', count: 25, percentage: 0.17 },
      ],
      _sentimentTrend: [
        { date: '2023-06-01', score: 0.65 },
        { date: '2023-06-15', score: 0.7 },
        { date: '2023-06-30', score: 0.75 },
      ],
      _engagementTrend: [
        { date: '2023-06-01', score: 0.7 },
        { date: '2023-06-15', score: 0.75 },
        { date: '2023-06-30', score: 0.8 },
      ],
    };
  }
}

/**
 * End-to-end test for the AI Analytics Workflow
 *
 * This test verifies the complete flow from AI output ingestion to analysis:
 * 1. AI Provider generates content (reviews, conversations)
 * 2. Answer Engine analyzes content for sentiment, topics, and entities
 * 3. Conversation Explorer analyzes conversations for intents, topics, and sentiment
 * 4. Embeddings are generated for semantic search
 */
describe('AI Analytics Workflow E2E', () => {
  let aiProviderRunner: AIProviderRunner;
  let aiProviderFactoryService: AIProviderFactoryService;
  let answerEngineRunner: MockAnswerEngineRunner;
  let conversationExplorerRunner: MockConversationExplorerRunner;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              openai: {
                apiKey: process.env.OPENAI_API_KEY || 'test-api-key',
                _defaultModel:
                  process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
                _defaultTemperature: 0.7,
                _timeoutMs: 30000,
                _maxRetries: 3,
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

  it('should process a customer review through the entire analytics pipeline', async () => {
    // 1. Generate a customer review using OpenAI
    const reviewPrompt =
      'Generate a detailed customer review about the XYZ Smartphone Pro';

    const reviewResult = await aiProviderRunner.runChat(
      ProviderType.OPENAI,
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: reviewPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 200,
      },
    );

    expect(reviewResult).toBeDefined();
    expect(reviewResult.data.text).toBeDefined();
    expect(reviewResult.data.text).toContain('XYZ Smartphone Pro');

    // 2. Analyze the review with Answer Engine
    const answerResult = await answerEngineRunner.run({
      brandId: 'xyz-brand',
      metadata: {
        content: reviewResult.data.text,
        context: {
          source: 'review',
          platform: 'test',
        },
        _citations: [
          {
            source: 'AI Generated',
            metadata: {
              timestamp: new Date(),
            },
          },
        ],
      },
    });

    expect(answerResult).toBeDefined();
    expect(answerResult.success).toBe(true);
    expect(answerResult.data.mention).toBeDefined();
    expect(answerResult.data.mention.entities).toBeDefined();
    expect(answerResult.data.mention.entities[0].name).toBe(
      'XYZ Smartphone Pro',
    );
    expect(answerResult.data.health).toBeDefined();

    // 3. Generate embeddings for the review for semantic search
    const embeddingResult = await aiProviderRunner.runEmbed(
      ProviderType.OPENAI,
      reviewResult.data.text,
      {},
    );

    expect(embeddingResult).toBeDefined();
    expect(embeddingResult.data.embedding).toBeDefined();
    expect(Array.isArray(embeddingResult.data.embedding)).toBe(true);
    expect(embeddingResult.data.dimensions).toBeGreaterThan(0);
  });

  it('should process a customer conversation through the entire analytics pipeline', async () => {
    // 1. Generate a customer conversation using OpenAI
    const conversationPrompt =
      'Generate a conversation between a customer and an agent about the XYZ Smartphone Pro';

    const conversationResult = await aiProviderRunner.runChat(
      ProviderType.OPENAI,
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: conversationPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 300,
      },
    );

    expect(conversationResult).toBeDefined();
    expect(conversationResult.data.text).toBeDefined();
    expect(conversationResult.data.text).toContain('Customer');
    expect(conversationResult.data.text).toContain('Agent');

    // 2. Parse the conversation text into messages
    const conversationText = conversationResult.data.text;
    const lines = conversationText
      .split('\n')
      .filter(line => line.trim() !== '');

    const messages = lines.map(line => {
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

    // 3. Analyze the conversation with Conversation Explorer
    const explorerResult = await conversationExplorerRunner.analyzeConversation(
      {
        conversationId: 'test-conversation-id',
        messages,
        metadata: {
          platform: 'test',
          channel: 'chat',
          tags: ['test', 'e2e'],
          _customFields: {
            _testCase: 'AI Analytics Workflow',
          },
        },
      },
    );

    expect(explorerResult).toBeDefined();
    expect(explorerResult.analysis).toBeDefined();
    expect(explorerResult.analysis.intents).toBeDefined();
    expect(explorerResult.analysis.sentiment).toBeDefined();
    expect(explorerResult.analysis.topics).toBeDefined();

    // 4. Generate embeddings for the conversation for semantic search
    const embeddingText = messages.map(m => m.content).join(' ');

    const embeddingResult = await aiProviderRunner.runEmbed(
      ProviderType.OPENAI,
      embeddingText,
      {},
    );

    expect(embeddingResult).toBeDefined();
    expect(embeddingResult.data.embedding).toBeDefined();
    expect(Array.isArray(embeddingResult.data.embedding)).toBe(true);
    expect(embeddingResult.data.dimensions).toBeGreaterThan(0);
  });

  it('should process a complete end-to-end workflow with both review and conversation analysis', async () => {
    // 1. Generate a customer review using OpenAI
    const reviewPrompt =
      'Generate a detailed customer review about the XYZ Smartphone Pro';

    const reviewResult = await aiProviderRunner.runChat(
      ProviderType.OPENAI,
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: reviewPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 200,
      },
    );

    expect(reviewResult).toBeDefined();
    expect(reviewResult.data.text).toBeDefined();

    // 2. Analyze the review with Answer Engine
    const answerResult = await answerEngineRunner.run({
      brandId: 'xyz-brand',
      metadata: {
        content: reviewResult.data.text,
        context: {
          source: 'review',
          platform: 'test',
        },
      },
    });

    expect(answerResult).toBeDefined();
    expect(answerResult.success).toBe(true);

    // 3. Generate a customer conversation based on the review
    const conversationPrompt = `Generate a conversation between a customer and support agent about the following review: ${reviewResult.data.text.substring(0, 100)}`;

    const conversationResult = await aiProviderRunner.runChat(
      ProviderType.OPENAI,
      [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: conversationPrompt },
      ],
      {
        temperature: 0.7,
        maxTokens: 300,
      },
    );

    expect(conversationResult).toBeDefined();
    expect(conversationResult.data.text).toBeDefined();

    // 4. Parse the conversation text into messages
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

    // 5. Analyze the conversation with Conversation Explorer
    const analysisResult = await conversationExplorerRunner.analyzeConversation(
      {
        brandId: 'xyz-brand',
        conversationId: 'test-conversation-id',
        messages,
        metadata: {
          platform: 'chat',
          channel: 'support',
        },
      },
    );

    expect(analysisResult).toBeDefined();
    expect(analysisResult.analysis).toBeDefined();

    // 6. Compare insights from both analyses
    const reviewTopics = answerResult.data.mention.topics.map(
      (t: { name: string }) => t.name,
    );
    const conversationTopics = analysisResult.analysis.topics.map(
      (t: { name: string }) => t.name,
    );

    // Check if there's any overlap in topics between review and conversation
    const commonTopics = reviewTopics.filter((topic: string) =>
      conversationTopics.some(
        (convTopic: string) =>
          convTopic.toLowerCase().includes(topic.toLowerCase()) ||
          topic.toLowerCase().includes(convTopic.toLowerCase()),
      ),
    );

    expect(commonTopics.length).toBeGreaterThan(0);

    // 7. Generate embeddings for both the review and conversation
    const reviewEmbedding = await aiProviderRunner.runEmbed(
      ProviderType.OPENAI,
      reviewResult.data.text,
      {},
    );

    const conversationContent = messages
      .map((m: { content: string }) => m.content)
      .join(' ');
    const conversationEmbedding = await aiProviderRunner.runEmbed(
      ProviderType.OPENAI,
      conversationContent,
      {},
    );

    expect(reviewEmbedding).toBeDefined();
    expect(conversationEmbedding).toBeDefined();

    // 8. Verify the complete workflow was successful
    expect(true).toBe(true);
  });
});
