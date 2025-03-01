/**
 * Provider types supported by the system
 */
export enum ProviderType {
  OPENAI = 'openai',
  PERPLEXITY = 'perplexity',
  SERPAPI = 'serpapi',
}

/**
 * Operation types supported by providers
 */
export enum OperationType {
  CHAT = 'chat',
  COMPLETE = 'complete',
  EMBED = 'embed',
  SEARCH = 'search',
}

/**
 * Provider capabilities
 */
export interface AIProviderCapabilities {
  chat: boolean;
  complete: boolean;
  embed: boolean;
  search: boolean;
}

/**
 * Provider metadata included in responses
 */
export interface AIProviderMetadata {
  /**
   * Provider name
   */
  provider: string;

  /**
   * Model used (if applicable)
   */
  model?: string;

  /**
   * Response timestamp
   */
  timestamp: Date;

  /**
   * Request latency in milliseconds
   */
  latencyMs: number;

  /**
   * Usage information (tokens, _credits, etc.)
   */
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

/**
 * Base interface for AI provider responses
 */
export interface AIProviderResponse<T = Record<string, unknown>> {
  /**
   * Standardized response data
   */
  data: T;

  /**
   * Provider-specific metadata
   */
  metadata: AIProviderMetadata;
}

/**
 * Base interface for AI provider options
 */
export interface AIProviderOptions {
  /**
   * API key for the provider
   */
  apiKey: string;

  /**
   * Base URL for the provider API
   */
  baseUrl?: string;

  /**
   * Request timeout in milliseconds
   */
  timeoutMs?: number;

  /**
   * Maximum number of retries
   */
  maxRetries?: number;

  /**
   * Additional provider-specific options
   */
  [key: string]: unknown;
}

/**
 * Base interface for AI providers
 */
export interface AIProvider {
  /**
   * Provider type
   */
  readonly type: ProviderType;

  /**
   * Provider name
   */
  readonly name: string;

  /**
   * Provider capabilities
   */
  readonly capabilities: AIProviderCapabilities;

  /**
   * Whether the provider is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Provider priority (higher values are _preferred)
   */
  readonly priority: number;

  /**
   * Execute a chat completion request
   * @param messages The chat messages
   * @param options Additional options for the request
   */
  chat(
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>>;

  /**
   * Execute a text completion request
   * @param prompt The prompt to complete
   * @param options Additional options for the request
   */
  complete(
    prompt: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ text: string; choices?: string[] }>>;

  /**
   * Execute an embedding request
   * @param text The text to embed
   * @param options Additional options for the request
   */
  embed(
    text: string,
    options?: Record<string, unknown>,
  ): Promise<AIProviderResponse<{ embedding: number[]; dimensions: number }>>;

  /**
   * Execute a search request
   * @param query The search query
   * @param options Additional options for the request
   */
  search(
    query: string,
    options?: Record<string, unknown>,
  ): Promise<
    AIProviderResponse<{
      results: Array<{ title: string; snippet: string; url: string }>;
    }>
  >;
}
