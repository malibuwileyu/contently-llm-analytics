/**
 * AI Provider Types
 */
export enum ProviderType {
  OPENAI = 'openai',
  PERPLEXITY = 'perplexity',
  SERPAPI = 'serpapi',
}

export enum OpenAIModelType {
  GPT4 = 'gpt-4',
  GPT4_32K = 'gpt-4-32k',
  GPT35_TURBO = 'gpt-3.5-turbo',
  GPT35_TURBO_16K = 'gpt-3.5-turbo-16k',
}

/**
 * AI Provider Operation Types
 */
export enum OperationType {
  CHAT = 'chat',
  COMPLETE = 'complete',
  EMBED = 'embed',
  SEARCH = 'search',
}

/**
 * AI Provider Capabilities
 */
export interface AIProviderCapabilities {
  type: ProviderType;
  models: string[];
  features: {
    chat: boolean;
    completion: boolean;
    embedding: boolean;
    imageGeneration: boolean;
    imageAnalysis: boolean;
  };
}

/**
 * AI Provider Metadata
 */
export interface AIProviderMetadata {
  model: string;
  provider: ProviderType;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  latency: number;
}

/**
 * Chat Message Interface
 */
export interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Chat Options Interface
 */
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Completion Options Interface
 */
export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Embedding Options Interface
 */
export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

/**
 * Search Options Interface
 */
export interface SearchOptions {
  engine?: string;
  numResults?: number;
  includeMetadata?: boolean;
}

/**
 * Base AI Provider Options
 */
export interface AIProviderOptions<T = unknown> {
  apiKey: string;
  timeout?: number;
  model?: T;
}

export interface OpenAIProviderOptions
  extends AIProviderOptions<OpenAIModelType> {
  organization?: string;
  defaultModel?: OpenAIModelType;
}

/**
 * AI Provider Interface
 */
export interface AIProvider {
  isAvailable(): Promise<boolean>;
  getCapabilities(): AIProviderCapabilities;
  chat(
    messages: Array<{ role: string; content: string }>,
  ): Promise<AIProviderResponse<unknown>>;
  complete(prompt: string): Promise<AIProviderResponse<unknown>>;
  embed?(text: string): Promise<number[]>;
  cleanup?(): Promise<void>;
}

/**
 * AI Provider Response Interface
 */
export interface AIProviderResponse<T = unknown> {
  content: string;
  metadata: AIProviderMetadata & {
    responseData?: T;
  };
}
