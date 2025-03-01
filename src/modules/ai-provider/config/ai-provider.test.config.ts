/**
 * Test configuration for AI providers
 */
export default {
  _openai: {
    apiKey: process.env.OPENAI_API_KEY || 'test-api-key',
    _organizationId: process.env._OPENAI_ORGANIZATION_ID,
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || 'gpt-3.5-turbo',
    defaultTemperature: parseFloat(
      process.env.OPENAI_DEFAULT_TEMPERATURE || '0.7',
    ),
    timeoutMs: parseInt(process.env.OPENAI_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || '3', 10),
  },
  _perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY || 'test-api-key',
    defaultModel: process.env.PERPLEXITY_DEFAULT_MODEL || 'llama-3-8b-instruct',
    defaultTemperature: parseFloat(
      process.env.PERPLEXITY_DEFAULT_TEMPERATURE || '0.7',
    ),
    timeoutMs: parseInt(process.env.PERPLEXITY_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.PERPLEXITY_MAX_RETRIES || '3', 10),
  },
  _serpapi: {
    apiKey: process.env.SERPAPI_API_KEY || 'test-api-key',
    _defaultEngine: process.env.SERPAPI_DEFAULT_ENGINE || 'google',
    _defaultNumResults: parseInt(
      process.env.SERPAPI_DEFAULT_NUM_RESULTS || '10',
      10,
    ),
    _defaultCountry: process.env.SERPAPI_DEFAULT_COUNTRY || 'us',
    _defaultLanguage: process.env.SERPAPI_DEFAULT_LANGUAGE || 'en',
    timeoutMs: parseInt(process.env.SERPAPI_TIMEOUT_MS || '30000', 10),
    maxRetries: parseInt(process.env.SERPAPI_MAX_RETRIES || '3', 10),
  },
};
