import { Logger } from '@nestjs/common';
import {
  AIProvider,
  AIProviderOptions,
  AIProviderResponse,
  AIProviderMetadata,
  AIProviderCapabilities,
  ProviderType,
} from '../interfaces/ai-provider.interface';

/**
 * Base abstract class for AI providers
 */
export abstract class BaseAIProvider implements AIProvider {
  protected readonly logger: Logger;
  protected readonly options: AIProviderOptions;
  protected available = true;

  /**
   * Provider type
   */
  abstract readonly type: ProviderType;

  /**
   * Provider capabilities
   */
  abstract readonly capabilities: AIProviderCapabilities;

  /**
   * Provider priority (higher values are preferred)
   */
  abstract readonly priority: number;

  /**
   * Constructor
   * @param name Provider name
   * @param options Provider options
   */
  constructor(
    public readonly name: string,
    options: AIProviderOptions,
  ) {
    this.logger = new Logger(`${name}Provider`);
    this.options = {
      _timeoutMs: 30000,
      _maxRetries: 3,
      ...options,
    };
  }

  /**
   * Get the provider name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    return this.available;
  }

  /**
   * Get the provider's capabilities
   */
  abstract getCapabilities(): string[];

  /**
   * Execute a text completion request
   * @param prompt The prompt to complete
   * @param options Additional options for the request
   */
  abstract complete(
    prompt: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>>;

  /**
   * Execute a chat completion request
   * @param messages The chat messages
   * @param options Additional options for the request
   */
  abstract chat(
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>>;

  /**
   * Execute an embedding request
   * @param text The text to embed
   * @param options Additional options for the request
   */
  abstract embed(
    text: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ embedding: number[]; dimensions: number }>>;

  /**
   * Execute a search request
   * @param query The search query
   * @param options Additional options for the request
   */
  abstract search(
    query: string,
    options?: Record<string, unknown>,
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  >;

  /**
   * Create a standardized response
   * @param rawResponse Raw response from the provider
   * @param data Standardized data
   * @param metadata Additional metadata
   */
  protected createResponse<T>(
    rawResponse: unknown,
    data: T,
    metadata: Partial<AIProviderMetadata> = {},
  ): AIProviderResponse<T> {
    return {
      data,
      metadata: {
        provider: this.name,
        timestamp: new Date(),
        latencyMs: metadata.latencyMs || 0,
        model: metadata.model,
        usage: metadata.usage,
      },
    };
  }

  /**
   * Handle errors from the provider
   * @param error Error object
   * @param operation Operation that caused the error
   */
  protected handleError(error: Error, operation: string): never {
    this.logger.error(
      `Error during ${operation}: ${error.message}`,
      error.stack,
    );

    // Check if the error is related to authentication or rate limiting
    if (
      error.message.includes('authentication') ||
      error.message.includes('auth') ||
      error.message.includes('key') ||
      error.message.includes('credential')
    ) {
      this.available = false;
      throw new Error(`${this.name} authentication error: ${error.message}`);
    }

    // Check if the error is related to rate limiting
    if (
      error.message.includes('rate') ||
      error.message.includes('limit') ||
      error.message.includes('quota')
    ) {
      throw new Error(`${this.name} rate limit _exceeded: ${error.message}`);
    }

    throw new Error(`${this.name} error during ${operation}: ${error.message}`);
  }
}
