import { Injectable, Logger } from '@nestjs/common';
import { AIProviderFactoryService } from '../services/ai-provider-factory.service';
import { AIProviderResponse, OperationType, ProviderType } from '../interfaces';

/**
 * Type definitions for operation inputs and responses
 */
interface ChatInput {
  role: string;
  content: string;
}

interface ChatResponse {
  text: string;
  choices?: string[];
}

interface CompleteResponse {
  text: string;
  choices?: string[];
}

interface EmbedResponse {
  embedding: number[];
  dimensions: number;
}

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface SearchResponse {
  results: SearchResult[];
}

/**
 * Runner for AI provider operations
 */
@Injectable()
export class AIProviderRunner {
  private readonly logger = new Logger('AIProviderRunner');

  constructor(private readonly aiProviderFactory: AIProviderFactoryService) {}

  /**
   * Run a chat operation
   * @param type Provider type
   * @param messages Array of chat messages
   * @param options Additional options
   * @returns Chat completion response
   */
  async runChat(
    type: ProviderType,
    messages: ChatInput[],
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<ChatResponse>> {
    return this.run({
      type,
      operation: OperationType.CHAT,
      input: messages,
      options,
    });
  }

  /**
   * Run a text completion operation
   * @param type Provider type
   * @param prompt Text prompt
   * @param options Additional options
   * @returns Text completion response
   */
  async runComplete(
    type: ProviderType,
    prompt: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<CompleteResponse>> {
    return this.run({
      type,
      operation: OperationType.COMPLETE,
      input: prompt,
      options,
    });
  }

  /**
   * Run an embedding operation
   * @param type Provider type
   * @param text Text to embed
   * @param options Additional options
   * @returns Embedding response
   */
  async runEmbed(
    type: ProviderType,
    text: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<EmbedResponse>> {
    return this.run({
      type,
      operation: OperationType.EMBED,
      input: text,
      options,
    });
  }

  /**
   * Run a search operation
   * @param type Provider type
   * @param query Search query
   * @param options Additional options
   * @returns Search response
   */
  async runSearch(
    type: ProviderType,
    query: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<SearchResponse>> {
    return this.run({
      type,
      operation: OperationType.SEARCH,
      input: query,
      options,
    });
  }

  /**
   * Run an AI provider operation
   * @param context The operation context
   * @returns The operation result
   */
  private async run<T>(context: {
    type: ProviderType;
    operation: OperationType;
    input: unknown;
    options?: Record<string, unknown>;
  }): Promise<AIProviderResponse<T>> {
    const { type, operation, input, options } = context;

    this.logger.debug(`Running ${operation} operation with ${type} provider`);

    // Get the best available provider of the specified type
    const provider = await this.aiProviderFactory.getBestProviderByType(type);

    if (!provider) {
      throw new Error(`No available provider of type ${type}`);
    }

    // Execute the requested operation
    try {
      switch (operation) {
        case OperationType.CHAT:
          if (!Array.isArray(input)) {
            throw new Error('Chat operation requires an array of messages');
          }
          return (await provider.chat(
            input as ChatInput[],
            options,
          )) as AIProviderResponse<T>;

        case OperationType.COMPLETE:
          if (typeof input !== 'string') {
            throw new Error('Complete operation requires a string input');
          }
          return (await provider.complete(
            input,
            options,
          )) as AIProviderResponse<T>;

        case OperationType.EMBED:
          if (typeof input !== 'string') {
            throw new Error('Embed operation requires a string input');
          }
          return (await provider.embed(
            input,
            options,
          )) as AIProviderResponse<T>;

        case OperationType.SEARCH:
          if (typeof input !== 'string') {
            throw new Error('Search operation requires a string input');
          }
          return (await provider.search(
            input,
            options,
          )) as AIProviderResponse<T>;
      }

      throw new Error(`Unsupported operation: ${operation}`);
    } catch (error) {
      this.logger.error(
        `Error executing ${operation} operation with ${type} provider: ${error.message}`,
        error._stack,
      );
      throw error;
    }
  }
}
