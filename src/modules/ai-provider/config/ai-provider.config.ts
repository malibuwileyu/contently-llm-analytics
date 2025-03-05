import { registerAs } from '@nestjs/config';
import { OpenAIModelType } from '../interfaces/ai-provider.interface';

export interface AIProviderConfig {
  openai: {
    apiKey: string;
    organization?: string;
    defaultModel?: OpenAIModelType;
    timeout?: number;
  };
  perplexity?: {
    apiKey: string;
    defaultModel?: string;
    timeout?: number;
  };
  serpapi: {
    apiKey: string;
    timeout?: number;
  };
}

/**
 * AI provider configuration
 * Loads configuration from environment variables for each provider
 */
export default registerAs(
  'ai',
  (): AIProviderConfig => ({
    /**
     * OpenAI configuration
     */
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION,
      defaultModel:
        (process.env.OPENAI_DEFAULT_MODEL as OpenAIModelType) ||
        OpenAIModelType.GPT4,
      timeout: parseInt(process.env.OPENAI_TIMEOUT, 10) || 30000,
    },

    /**
     * Perplexity configuration (optional)
     */
    perplexity: process.env.PERPLEXITY_API_KEY
      ? {
          apiKey: process.env.PERPLEXITY_API_KEY,
          defaultModel: process.env.PERPLEXITY_DEFAULT_MODEL || 'codellama-34b',
          timeout: parseInt(process.env.PERPLEXITY_TIMEOUT, 10) || 30000,
        }
      : undefined,

    /**
     * SerpAPI configuration
     */
    serpapi: {
      apiKey: process.env.SERPAPI_API_KEY,
      timeout: parseInt(process.env.SERPAPI_TIMEOUT, 10) || 30000,
    },
  }),
);
