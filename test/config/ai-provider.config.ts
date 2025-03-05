import { registerAs } from '@nestjs/config';
import { OpenAIModelType } from '../../src/modules/ai-provider/interfaces/ai-provider.interface';

export default registerAs('ai', () => ({
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel:
      (process.env.OPENAI_DEFAULT_MODEL as OpenAIModelType) ||
      OpenAIModelType.GPT4,
    timeout: parseInt(process.env.OPENAI_TIMEOUT_MS, 10) || 30000,
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES, 10) || 3,
  },
}));
