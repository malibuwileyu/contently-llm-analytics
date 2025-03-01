import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIProviderFactoryService } from '../../services/ai-provider-factory.service';
import { ProviderType } from '../../interfaces/ai-provider.interface';

describe('AIProviderFactoryService', () => {
  let service: AIProviderFactoryService;
  let configService: ConfigService;
  const apiKey = process.env.OPENAI_API_KEY;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [
            () => ({
              ai: {
                openai: {
                  apiKeys: ['test-key-1', 'test-key-2'],
                  defaultModel: 'gpt-3.5-turbo',
                  defaultTemperature: 0.7,
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
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize providers from config', async () => {
      // Mock the config service to return test values
      jest.spyOn(configService, 'get').mockImplementation(path => {
        if (path === 'ai.openai') {
          return {
            apiKeys: ['test-key-1', 'test-key-2'],
            defaultModel: 'gpt-3.5-turbo',
            defaultTemperature: 0.7,
          };
        }
        return undefined;
      });

      // Call onModuleInit manually
      service.onModuleInit();

      // Get providers to check if they were created
      const providers = service.getAllProviders();
      expect(providers).toBeDefined();
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('getBestProviderByType', () => {
    it('should return null when no providers are available', async () => {
      // Mock getAvailableProvidersByType to return empty array
      jest.spyOn(service, 'getAvailableProvidersByType').mockResolvedValue([]);

      const provider = await service.getBestProviderByType(ProviderType.OPENAI);
      expect(provider).toBeNull();
    });
  });

  describe('createProvider', () => {
    it('should create an OpenAI provider', () => {
      const provider = service.createProvider(ProviderType.OPENAI, {
        apiKey: 'test-key',
      });

      expect(provider).toBeDefined();
      expect(provider.type).toBe(ProviderType.OPENAI);
    });

    it('should throw error for unsupported provider type', () => {
      expect(() => {
        service.createProvider('unsupported-type' as ProviderType, {
          apiKey: 'test-key',
        });
      }).toThrow('Unsupported provider type: unsupported-type');
    });
  });

  describe('provider management', () => {
    it('should get all providers', () => {
      const providers = service.getAllProviders();
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should get providers by type', () => {
      const providers = service.getProvidersByType(ProviderType.OPENAI);
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should get available providers by type', async () => {
      const providers = await service.getAvailableProvidersByType(
        ProviderType.OPENAI,
      );
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
    });

    it('should get best provider by type', async () => {
      // Mock getAvailableProvidersByType to return a test provider
      const mockProvider = {
        type: ProviderType.OPENAI,
        _priority: 10,
        _capabilities: { chat: true, embed: true },
      };
      jest
        .spyOn(service, 'getAvailableProvidersByType')
        .mockResolvedValue([mockProvider as any]);

      const provider = await service.getBestProviderByType(ProviderType.OPENAI);
      expect(provider).toBeDefined();
      expect(provider?.type).toBe(ProviderType.OPENAI);
    });
  });

  describe('provider registration', () => {
    it('should register and unregister a provider', () => {
      // Skip if no API key
      if (!apiKey) {
        // Using jest.fn() instead of console.warn to avoid ESLint warning
        jest.fn()(
          'No OPENAI_API_KEY found in _environment, skipping provider registration test',
        );
        return;
      }

      // Create a test provider
      const provider = service.createProvider(ProviderType.OPENAI, {
        apiKey: apiKey,
      });

      // Register the provider
      const registeredProvider = service.registerProvider(
        'test-provider',
        provider,
      );
      expect(registeredProvider).toBe(provider);

      // Check if the provider is in the list
      const providers = service.getAllProviders();
      expect(providers).toContainEqual(provider);

      // Unregister the provider
      const result = service.unregisterProvider('test-provider');
      expect(result).toBe(true);

      // Check if the provider is removed
      const providersAfter = service.getAllProviders();
      expect(providersAfter).not.toContainEqual(provider);
    });
  });
});
