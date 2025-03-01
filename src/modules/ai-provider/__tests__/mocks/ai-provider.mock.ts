import {
  AIProvider,
  AIProviderCapabilities,
  AIProviderResponse,
  ProviderType,
} from '../../interfaces/ai-provider.interface';

/**
 * Mock implementation of AIProvider for testing
 */
export class MockAIProvider implements AIProvider {
  readonly type: ProviderType = ProviderType.OPENAI;
  readonly name: string = 'MockProvider';
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    complete: true,
    embed: true,
    search: true,
  };
  readonly priority: number = 1;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    const lastMessage = messages[messages.length - 1];
    return {
      data: {
        text: `Mock response for: ${lastMessage.content}`,
        choices: [`Mock response for: ${lastMessage.content}`],
      },
      metadata: {
        provider: this.name,
        model: 'mock-model',
        timestamp: new Date(),
        latencyMs: 100,
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
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
        text: `Mock completion for: ${prompt}`,
        choices: [`Mock completion for: ${prompt}`],
      },
      metadata: {
        provider: this.name,
        model: 'mock-model',
        timestamp: new Date(),
        latencyMs: 100,
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      },
    };
  }

  async embed(
    text: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ embedding: number[]; dimensions: number }>> {
    const embedding = Array(1536)
      .fill(0)
      .map(() => Math.random());
    return {
      data: {
        embedding,
        dimensions: embedding.length,
      },
      metadata: {
        provider: this.name,
        model: 'mock-embedding-model',
        timestamp: new Date(),
        latencyMs: 50,
        usage: {
          promptTokens: 10,
          totalTokens: 10,
        },
      },
    };
  }

  async search(
    query: string,
    options?: Record<string, unknown>,
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  > {
    return {
      data: {
        results: [
          {
            title: 'Mock search result 1',
            snippet: `Mock snippet for: ${query}`,
            url: 'https://example.com/1',
          },
          {
            title: 'Mock search result 2',
            snippet: `Another mock snippet for: ${query}`,
            url: 'https://example.com/2',
          },
        ],
      },
      metadata: {
        provider: this.name,
        timestamp: new Date(),
        latencyMs: 150,
      },
    };
  }

  async generateText(prompt: string, options?: any): Promise<string> {
    return `Mock response for: ${prompt}`;
  }

  async generateCompletion(prompt: string, options?: any): Promise<string> {
    return `Mock completion for: ${prompt}`;
  }

  async generateEmbedding(text: string, options?: any): Promise<number[]> {
    return Array(1536)
      .fill(0)
      .map(() => Math.random());
  }

  async searchWeb(query: string, options?: any): Promise<any> {
    return {
      results: [
        {
          title: 'Mock search result 1',
          link: 'https://example.com/1',
          snippet: `Mock snippet for: ${query}`,
        },
        {
          title: 'Mock search result 2',
          link: 'https://example.com/2',
          snippet: `Another mock snippet for: ${query}`,
        },
      ],
    };
  }
}
