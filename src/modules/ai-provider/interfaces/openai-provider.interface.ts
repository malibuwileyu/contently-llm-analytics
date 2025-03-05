import {
  AIProviderOptions,
  AIProviderResponse,
  AIProviderMetadata,
} from './ai-provider.interface';

/**
 * OpenAI model types
 */
export enum OpenAIModelType {
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_4_TURBO = 'gpt-4-turbo',
  TEXT_EMBEDDING_ADA = 'text-embedding-ada-002',
  TEXT_EMBEDDING_3_SMALL = 'text-embedding-3-small',
  TEXT_EMBEDDING_3_LARGE = 'text-embedding-3-large',
}

/**
 * OpenAI provider options
 */
export interface OpenAIProviderOptions
  extends AIProviderOptions<OpenAIModelType> {
  /**
   * Organization ID for OpenAI
   */
  organizationId?: string;
}

/**
 * OpenAI chat message
 */
export interface OpenAIChatMessage {
  /**
   * Message role (system, user, assistant)
   */
  role: 'system' | 'user' | 'assistant' | 'function';

  /**
   * Message content
   */
  content: string;

  /**
   * Name of the function (for function role)
   */
  name?: string;
}

/**
 * OpenAI chat completion options
 */
export interface OpenAIChatOptions {
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
 * OpenAI embedding options
 */
export interface OpenAIEmbeddingOptions {
  /**
   * Model to use
   */
  model?: OpenAIModelType;

  /**
   * Encoding format
   */
  encoding?: 'float' | 'base64';
}

/**
 * OpenAI provider response
 */
export interface OpenAIProviderResponse
  extends AIProviderResponse<{
    text: string;
    choices?: string[];
    functionCalls?: Array<{
      name: string;
      arguments: string;
    }>;
  }> {
  metadata: AIProviderMetadata & {
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
  };
}
