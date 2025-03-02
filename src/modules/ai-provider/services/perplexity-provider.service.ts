import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider } from './base-ai-provider.service';
import {
  AIProviderResponse,
  PerplexityProviderOptions,
  PerplexityModelType,
  PerplexityChatOptions,
} from '../interfaces';

/**
 * Perplexity provider service
 */
@Injectable()
export class PerplexityProviderService extends BaseAIProvider {
  private client: AxiosInstance;
  private readonly defaultModel: PerplexityModelType;
  private readonly defaultTemperature: number;

  /**
   * Constructor
   * @param options Perplexity provider options
   */
  constructor(options: PerplexityProviderOptions) {
    super('Perplexity', options);

    this.defaultModel =
      options.defaultModel || PerplexityModelType.SONAR_MEDIUM_ONLINE;
    this.defaultTemperature = options.defaultTemperature || 0.7;

    try {
      this.client = axios.create({
        baseURL: options.baseUrl || 'https://api.perplexity.ai',
        timeout: options.timeoutMs || 30000,
        headers: {
          Authorization: `Bearer ${options.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      this.available = false;
      this.logger.error('Failed to initialize Perplexity client', error);
    }
  }

  /**
   * Get the provider's capabilities
   */
  getCapabilities(): string[] {
    return ['chat', 'search'];
  }

  /**
   * Execute a text completion request (redirects to chat for Perplexity)
   * @param prompt The prompt to complete
   * @param options Additional options for the request
   */
  async complete(
    prompt: string,
    options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  /**
   * Execute a chat completion request
   * @param messages The chat messages
   * @param options Additional options for the request
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    options: PerplexityChatOptions = {},
  ): Promise<AIProviderResponse> {
    try {
      const startTime = Date.now();

      const response = await this.client.post('/chat/completions', {
        model: options.model || this.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        temperature: options.temperature || this.defaultTemperature,
        max_tokens: options.max_tokens || 1024,
        stream: false,
      });

      const latencyMs = Date.now() - startTime;
      const data = response.data;

      // Extract search results if available
      const searchResults = this.extractSearchResults(data);

      return this.createResponse(
        data,
        {
          text: data.choices[0]?.message?.content || '',
          choices: data.choices.map(choice => choice.message?.content || ''),
          searchResults: searchResults,
        },
        {
          model: data.model,
          latencyMs,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
          searchResults: searchResults,
        },
      );
    } catch (error) {
      return this.handleError(error, 'chat');
    }
  }

  /**
   * Execute an embedding request (not supported by Perplexity)
   * @param text The text to embed
   * @param options Additional options for the request
   */
  async embed(
    _text: string,
    _options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    throw new Error('Embedding is not supported by Perplexity provider');
  }

  /**
   * Execute a search request
   * @param query The search query
   * @param options Additional options for the request
   */
  async search(
    query: string,
    options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    // Perplexity search is implemented through chat with search enabled
    const searchOptions: PerplexityChatOptions = {
      ...options,
      model:
        (options.model as PerplexityModelType) ||
        PerplexityModelType.SONAR_MEDIUM_ONLINE,
      search: true,
    };

    return this.chat([{ role: 'user', content: query }], searchOptions);
  }

  /**
   * Extract search results from Perplexity response
   * @param data Response data
   */
  private extractSearchResults(
    data: any,
  ): Array<{ title: string; url: string; snippet: string }> {
    try {
      // Perplexity includes search results in the message content
      // We need to parse them from the content
      const content = data.choices[0]?.message?.content || '';

      // Look for search results in the content
      // This is a simplified approach - in a real implementation,
      // you would need to parse the content more carefully
      const results: Array<{ title: string; url: string; snippet: string }> =
        [];

      // Try to find URLs in the content
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = content.match(urlRegex) || [];

      // Create basic search results from URLs
      urls.forEach((url, index) => {
        results.push({
          title: `Search Result ${index + 1}`,
          url,
          snippet: 'Extracted from Perplexity response',
        });
      });

      return results;
    } catch (error) {
      this.logger.warn(
        'Failed to extract search results from Perplexity response',
        error,
      );
      return [];
    }
  }
}
