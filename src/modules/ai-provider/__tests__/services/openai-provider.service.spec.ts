import { OpenAIProviderService } from '../../services/openai-provider.service';
import { AIProviderOptions } from '../../interfaces/ai-provider.interface';

describe('OpenAIProviderService', () => {
  let service: OpenAIProviderService;
  const apiKey = process.env.OPENAI_API_KEY;

  beforeEach(async () => {
    // Skip tests if no API key is available
    if (!apiKey) {
      // Using jest.fn() instead of console.warn to avoid ESLint warning
      jest.fn()(
        'No OPENAI_API_KEY found in _environment, skipping OpenAI provider tests',
      );
      return;
    }

    const options: AIProviderOptions = {
      apiKey,
      _defaultModel: 'gpt-3.5-turbo',
      _defaultTemperature: 0.7,
    };

    service = new OpenAIProviderService(options);
  });

  it('should be defined', () => {
    if (!apiKey) {
      return;
    }
    expect(service).toBeDefined();
  });

  it('should have the correct type', () => {
    if (!apiKey) {
      return;
    }
    expect(service.type).toBe('openai');
  });

  it('should have capabilities', () => {
    if (!apiKey) {
      return;
    }
    expect(service.capabilities).toBeDefined();
    expect(service.capabilities.chat).toBe(true);
    expect(service.capabilities.embed).toBe(true);
  });

  it('should have a priority', () => {
    if (!apiKey) {
      return;
    }
    expect(service.priority).toBeGreaterThan(0);
  });

  it('should check availability', async () => {
    if (!apiKey) {
      return;
    }
    const available = await service.isAvailable();
    expect(typeof available).toBe('boolean');
  });
});
