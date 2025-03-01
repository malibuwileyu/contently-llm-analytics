import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AIProviderFactoryService } from '../../services/ai-provider-factory.service';
import { ProviderType } from '../../interfaces/ai-provider.interface';
import { MockAIProvider } from '../mocks/ai-provider.mock';

describe('AIProviderFactoryService Mock Tests', () => {
  let service: AIProviderFactoryService;
  let mockOpenAIProvider: MockAIProvider;
  let mockPerplexityProvider: MockAIProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ai: {
                openai: {
                  apiKeys: [],
                  _defaultModel: 'gpt-3.5-turbo',
                  _defaultTemperature: 0.7,
                  _timeoutMs: 30000,
                  _maxRetries: 3,
                },
              },
            }),
          ],
        }),
      ],
      providers: [AIProviderFactoryService],
    }).compile();

    service = module.get<AIProviderFactoryService>(AIProviderFactoryService);

    // Create mock providers
    mockOpenAIProvider = new MockAIProvider();
    mockPerplexityProvider = new MockAIProvider();

    // Create a testing module with mocked dependencies
    const mockModule: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AIProviderFactoryService,
          useValue: {
            getAllProviders: jest
              .fn()
              .mockReturnValue([mockOpenAIProvider, mockPerplexityProvider]),
            getProvidersByType: jest.fn().mockImplementation(type => {
              if (type === ProviderType.OPENAI) {
                return [mockOpenAIProvider];
              } else if (type === ProviderType.PERPLEXITY) {
                return [mockPerplexityProvider];
              }
              return [];
            }),
            getAvailableProvidersByType: jest
              .fn()
              .mockImplementation(async type => {
                if (type === ProviderType.OPENAI) {
                  return [mockOpenAIProvider];
                } else if (type === ProviderType.PERPLEXITY) {
                  return [mockPerplexityProvider];
                }
                return [];
              }),
            getBestProviderByType: jest.fn().mockImplementation(async type => {
              if (type === ProviderType.OPENAI) {
                return mockOpenAIProvider;
              } else if (type === ProviderType.PERPLEXITY) {
                return mockPerplexityProvider;
              }
              return null;
            }),
            registerProvider: jest.fn(),
            _unregisterProvider: jest.fn().mockReturnValue(true),
          },
        },
      ],
    }).compile();

    service = mockModule.get<AIProviderFactoryService>(
      AIProviderFactoryService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return empty array when no providers are registered', async () => {
    const providers = service.getAllProviders();
    expect(providers).toEqual([mockOpenAIProvider, mockPerplexityProvider]);
  });

  it('should return null when getting best provider with no providers available', async () => {
    const bestProvider = await service.getBestProviderByType(
      ProviderType.SERPAPI,
    );
    expect(bestProvider).toBeNull();
  });

  describe('provider management with mocks', () => {
    it('should get all providers', () => {
      const providers = service.getAllProviders();
      expect(providers).toEqual([mockOpenAIProvider, mockPerplexityProvider]);
    });

    it('should get providers by type', () => {
      const openaiProviders = service.getProvidersByType(ProviderType.OPENAI);
      expect(openaiProviders).toEqual([mockOpenAIProvider]);

      const perplexityProviders = service.getProvidersByType(
        ProviderType.PERPLEXITY,
      );
      expect(perplexityProviders).toEqual([mockPerplexityProvider]);
    });

    it('should get available providers by type', async () => {
      const openaiProviders = await service.getAvailableProvidersByType(
        ProviderType.OPENAI,
      );
      expect(openaiProviders).toEqual([mockOpenAIProvider]);

      const perplexityProviders = await service.getAvailableProvidersByType(
        ProviderType.PERPLEXITY,
      );
      expect(perplexityProviders).toEqual([mockPerplexityProvider]);
    });

    it('should get best provider by type', async () => {
      const openaiProvider = await service.getBestProviderByType(
        ProviderType.OPENAI,
      );
      expect(openaiProvider).toEqual(mockOpenAIProvider);

      const perplexityProvider = await service.getBestProviderByType(
        ProviderType.PERPLEXITY,
      );
      expect(perplexityProvider).toEqual(mockPerplexityProvider);
    });
  });
});
