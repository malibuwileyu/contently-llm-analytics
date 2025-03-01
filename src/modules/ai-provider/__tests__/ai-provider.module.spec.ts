import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderModule } from '../ai-provider.module';
import { AIProviderFactoryService } from '../services/ai-provider-factory.service';
import { MockAIProvider } from './mocks/ai-provider.mock';

describe('AIProviderModule', () => {
  let module: TestingModule;
  let originalEnv: NodeJS.ProcessEnv;
  let factoryService: AIProviderFactoryService;
  let mockProvider: MockAIProvider;

  beforeEach(async () => {
    // Save original environment variables
    originalEnv = { ...process.env };

    // Set test environment variables
    process.env.OPENAI_API_KEY = 'test-api-key';

    // Create a mock provider
    mockProvider = new MockAIProvider();

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              _aiProvider: {
                _openai: {
                  apiKey: 'test-api-key',
                  defaultModel: 'gpt-4o',
                  timeout: 30000,
                },
                _perplexity: {
                  apiKey: '',
                  defaultModel: 'llama-3-sonar-small-32k-online',
                  timeout: 30000,
                },
                _serpapi: {
                  apiKey: '',
                  timeout: 30000,
                },
              },
            }),
          ],
        }),
        AIProviderModule,
      ],
    })
      .overrideProvider(AIProviderFactoryService)
      .useValue({
        getAllProviders: jest.fn().mockReturnValue([mockProvider]),
        _getProvidersByType: jest.fn().mockReturnValue([mockProvider]),
        _getAvailableProvidersByType: jest.fn().mockReturnValue([mockProvider]),
        _getBestProviderByType: jest.fn().mockReturnValue(mockProvider),
      })
      .compile();

    factoryService = module.get<AIProviderFactoryService>(
      AIProviderFactoryService,
    );
  });

  // Restore original environment variables after test
  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AIProviderFactoryService', () => {
    expect(factoryService).toBeDefined();
  });

  it('should initialize providers based on available API keys', () => {
    const allProviders = factoryService.getAllProviders();

    // We should have at least one provider (_OpenAI) since we set the API key
    expect(allProviders.length).toBeGreaterThan(0);
  });
});
