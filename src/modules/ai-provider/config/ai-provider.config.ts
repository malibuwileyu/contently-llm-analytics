import { registerAs } from '@nestjs/config';

export interface AIProviderConfig {
  openai: {
    apiKey: string;
    organization?: string;
    defaultModel: string;
    timeout: number;
  };
  perplexity: {
    apiKey: string;
    defaultModel: string;
    timeout: number;
  };
  serpapi: {
    apiKey: string;
    timeout: number;
  };
}

/**
 * AI provider configuration
 */
export default registerAs(
  'aiProvider',
  (): AIProviderConfig => ({
    /**
     * OpenAI configuration
     */
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      organization: process.env.OPENAI_ORGANIZATION,
      defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o',
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000', 10),
    },

    /**
     * Perplexity configuration
     */
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY || '',
      defaultModel:
        process.env.PERPLEXITY_DEFAULT_MODEL ||
        'llama-3-sonar-small-32k-online',
      timeout: parseInt(process.env.PERPLEXITY_TIMEOUT || '30000', 10),
    },

    /**
     * SerpAPI configuration
     */
    serpapi: {
      apiKey: process.env.SERPAPI_API_KEY || '',
      timeout: parseInt(process.env.SERPAPI_TIMEOUT || '30000', 10),
    },
  }),
);
