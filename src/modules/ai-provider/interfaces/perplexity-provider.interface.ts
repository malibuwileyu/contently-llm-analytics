import { AIProviderOptions, AIProviderResponse } from './ai-provider.interface';

/**
 * Perplexity model types
 */
export enum PerplexityModelType {
  SONAR_SMALL_ONLINE = 'sonar-small-online',
  SONAR_MEDIUM_ONLINE = 'sonar-medium-online',
  CODELLAMA_70B = 'codellama-70b',
  MIXTRAL_8X7B = 'mixtral-8x7b',
  LLAMA_3_70B = 'llama-3-70b-online',
  LLAMA_3_8B = 'llama-3-8b-online',
}

/**
 * Perplexity provider options
 */
export interface PerplexityProviderOptions extends AIProviderOptions {
  /**
   * Default model to use
   */
  defaultModel?: PerplexityModelType;

  /**
   * Default temperature for completions
   */
  defaultTemperature?: number;
}

/**
 * Perplexity chat message
 */
export interface PerplexityChatMessage {
  /**
   * Message role (system, user, assistant)
   */
  role: 'system' | 'user' | 'assistant';

  /**
   * Message content
   */
  content: string;
}

/**
 * Perplexity chat completion options
 */
export interface PerplexityChatOptions {
  /**
   * Model to use
   */
  model?: PerplexityModelType;

  /**
   * Temperature for randomness (0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   */
  max_tokens?: number;

  /**
   * Whether to search the web for information
   */
  search?: boolean;
}

/**
 * Perplexity provider response
 */
export interface PerplexityProviderResponse extends AIProviderResponse {
  /**
   * Perplexity-specific metadata
   */
  metadata: AIProviderResponse['metadata'] & {
    /**
     * Model used for the response
     */
    model: string;

    /**
     * Usage information
     */
    usage: {
      /**
       * Prompt tokens
       */
      promptTokens: number;

      /**
       * Completion tokens
       */
      completionTokens: number;

      /**
       * Total tokens
       */
      totalTokens: number;
    };

    /**
     * Search results if search was enabled
     */
    searchResults?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  };
}
