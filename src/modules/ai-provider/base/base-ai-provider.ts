export interface AIProviderMetadata {
  provider: string;
  latency: number;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  responseData?: unknown;
}

export interface AIProviderResponse<T = unknown> {
  content: string;
  metadata: AIProviderMetadata & { responseData?: T };
}

export interface BaseAIProvider {
  complete(prompt: string): Promise<AIProviderResponse>;
} 