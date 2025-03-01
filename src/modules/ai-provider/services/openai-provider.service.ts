import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { BaseAIProvider } from './base-ai-provider.service';
import {
  AIProviderCapabilities,
  AIProviderOptions,
  AIProviderResponse,
  ProviderType,
} from '../interfaces/ai-provider.interface';

/**
 * OpenAI model types
 */
enum OpenAIModelType {
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  TEXT_EMBEDDING_ADA = 'text-embedding-ada-002',
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
}

/**
 * OpenAI chat completion options
 */
interface OpenAIChatOptions {
  /**
   * Model to use
   */
  model?: OpenAIModelType;

  /**
   * Temperature for randomness (0-2)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  maxTokens?: number;

  /**
   * Stop sequences
   */
  stop?: string[];

  /**
   * Function calling configuration
   */
  functions?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, unknown>;
  }>;
}

/**
 * OpenAI provider service
 */
@Injectable()
export class OpenAIProviderService extends BaseAIProvider {
  /**
   * Provider type
   */
  readonly type: ProviderType = ProviderType.OPENAI;

  /**
   * Provider capabilities
   */
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    complete: true,
    embed: true,
    search: false,
  };

  /**
   * Provider priority (higher values are preferred)
   */
  readonly priority: number = 10;

  /**
   * Provider name
   */
  public readonly name: string = 'OpenAI';

  private client: OpenAI;
  private readonly defaultModel: OpenAIModelType;
  private readonly defaultTemperature: number;

  /**
   * Constructor
   * @param options OpenAI provider options
   */
  constructor(options: AIProviderOptions) {
    super('OpenAI', options);

    this.defaultModel =
      (options.defaultModel as OpenAIModelType) ||
      OpenAIModelType.GPT_3_5_TURBO;
    this.defaultTemperature = (options.defaultTemperature as number) || 0.7;

    try {
      this.client = new OpenAI({
        apiKey: options.apiKey,
        organization: options.organizationId as string,
        timeout: options.timeoutMs,
        maxRetries: options.maxRetries,
      });
    } catch (error) {
      this.available = false;
      this.logger.error('Failed to initialize OpenAI client', error);
    }
  }

  /**
   * Get the provider's capabilities
   */
  getCapabilities(): string[] {
    return ['complete', 'chat', 'embed'];
  }

  /**
   * Execute a text completion request
   * @param prompt The prompt to complete
   * @param options Additional options for the request
   */
  async complete(
    prompt: string,
    options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    try {
      const startTime = Date.now();

      const response = await this.client.completions.create({
        model: (options.model as string) || 'text-davinci-003',
        prompt,
        temperature: (options.temperature as number) || this.defaultTemperature,
        max_tokens: (options.maxTokens as number) || 150,
        top_p: (options.topP as number) || 1,
        frequency_penalty: (options.frequencyPenalty as number) || 0,
        presence_penalty: (options.presencePenalty as number) || 0,
      });

      const latencyMs = Date.now() - startTime;

      const data = {
        text: response.choices[0]?.text || '',
        choices: response.choices.map(choice => choice.text || ''),
      };

      return this.createResponse(response, data, {
        model: response.model,
        latencyMs,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      });
    } catch (error) {
      return this.handleError(error, 'complete');
    }
  }

  /**
   * Execute a chat completion request
   * @param messages The chat messages
   * @param options Additional options for the request
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>> {
    try {
      const startTime = Date.now();

      const chatOptions = options as OpenAIChatOptions;

      const response = await this.client.chat.completions.create({
        model: chatOptions.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: chatOptions.temperature || this.defaultTemperature,
        max_tokens: chatOptions.maxTokens,
        functions: chatOptions.functions,
      });

      const latencyMs = Date.now() - startTime;

      const data = {
        text: response.choices[0]?.message?.content || '',
        choices: response.choices.map(choice => choice.message?.content || ''),
        functionCalls: response.choices
          .filter(choice => choice.message?.function_call)
          .map(choice => choice.message?.function_call),
      };

      return this.createResponse(response, data, {
        model: response.model,
        latencyMs,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      });
    } catch (error) {
      return this.handleError(error, 'chat');
    }
  }

  /**
   * Execute an embedding request
   * @param text The text to embed
   * @param options Additional options for the request
   */
  async embed(
    text: string,
    options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse<{ embedding: number[]; dimensions: number }>> {
    try {
      const startTime = Date.now();

      const response = await this.client.embeddings.create({
        model: (options.model as string) || OpenAIModelType.TEXT_EMBEDDING_ADA,
        input: text,
        encoding_format: (options.encoding as 'float' | 'base64') || 'float',
      });

      const latencyMs = Date.now() - startTime;

      const data = {
        embedding: response.data[0]?.embedding || [],
        dimensions: response.data[0]?.embedding?.length || 0,
      };

      return this.createResponse(response, data, {
        model: response.model,
        latencyMs,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      });
    } catch (error) {
      return this.handleError(error, 'embed');
    }
  }

  /**
   * Execute a search request (not supported by OpenAI)
   * @param query The search query
   * @param options Additional options for the request
   */
  async search(
    query: string,
    options: Record<string, unknown> = {},
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  > {
    throw new Error('Search is not supported by OpenAI provider');
  }
}
