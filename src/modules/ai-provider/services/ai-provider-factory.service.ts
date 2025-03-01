import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider, AIProviderOptions, ProviderType } from '../interfaces';
import { OpenAIProviderService } from './openai-provider.service';

/**
 * Factory service for AI providers
 */
@Injectable()
export class AIProviderFactoryService implements OnModuleInit {
  private readonly logger = new Logger(AIProviderFactoryService.name);
  private readonly providers: Map<string, AIProvider> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.logger.log('AI Provider Factory initialized');
  }

  /**
   * Initialize providers on module initialization
   */
  onModuleInit(): void {
    this.logger.log('Initializing AI Provider Factory Service');
    this.initializeProviders();
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(): void {
    this.initializeOpenAIProviders();
    // Future: this.initializePerplexityProviders();
    // Future: this.initializeSerpAPIProviders();
  }

  /**
   * Initialize OpenAI providers
   */
  private initializeOpenAIProviders(): void {
    const openaiConfig = this.configService.get('ai.openai');

    // Check if we have a direct API key in the environment
    const directApiKey = process.env.OPENAI_API_KEY;
    if (directApiKey) {
      this.logger.log('Initializing OpenAI provider with direct API key');
      this.createAndRegisterOpenAIProvider(directApiKey, openaiConfig);
      return;
    }

    // Otherwise use the config from ai.openai.apiKeys
    if (openaiConfig?.apiKeys?.length > 0) {
      this.logger.log(
        `Initializing ${openaiConfig.apiKeys.length} OpenAI providers`,
      );

      openaiConfig.apiKeys.forEach((apiKey: string, index: number) => {
        this.createAndRegisterOpenAIProvider(apiKey, openaiConfig, index);
      });
    } else {
      this.logger.warn('No OpenAI API keys configured');
    }
  }

  /**
   * Create and register a single OpenAI provider
   */
  private createAndRegisterOpenAIProvider(
    apiKey: string,
    config: Record<string, unknown>,
    index = 0,
  ): void {
    try {
      const options: AIProviderOptions = {
        apiKey,
        organizationId: config?.organizationId as string,
        defaultModel: config?.defaultModel,
        defaultTemperature: config?.defaultTemperature as number,
        timeoutMs: config?.timeoutMs as number,
        maxRetries: config?.maxRetries as number,
      };

      const provider = new OpenAIProviderService(options);

      const providerId = `${ProviderType.OPENAI}-${index}`;
      this.registerProvider(providerId, provider);
      this.logger.log(`Registered OpenAI provider: ${providerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to register OpenAI provider: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get all registered providers
   * @returns All registered providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   * @param type The provider type
   * @returns Providers of the specified type
   */
  getProvidersByType(type: ProviderType): AIProvider[] {
    return this.getAllProviders().filter(provider => provider.type === type);
  }

  /**
   * Get available providers by type
   * @param type The provider type
   * @returns Available providers of the specified type
   */
  async getAvailableProvidersByType(type: ProviderType): Promise<AIProvider[]> {
    const providers = this.getProvidersByType(type);
    const availableProviders: AIProvider[] = [];

    for (const provider of providers) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          availableProviders.push(provider);
        }
      } catch (error) {
        this.logger.error(
          `Error checking provider _availability: ${error.message}`,
          error.stack,
        );
      }
    }

    return availableProviders;
  }

  /**
   * Get the best provider by type
   * @param type The provider type
   * @returns The best available provider of the specified type
   */
  async getBestProviderByType(type: ProviderType): Promise<AIProvider | null> {
    const availableProviders = await this.getAvailableProvidersByType(type);

    if (availableProviders.length === 0) {
      return null;
    }

    // Sort by priority (highest _first)
    return availableProviders.sort((a, b) => b.priority - a.priority)[0];
  }

  /**
   * Register a new provider
   * @param id The provider ID
   * @param provider The provider instance
   * @returns The registered provider
   */
  registerProvider(id: string, provider: AIProvider): AIProvider {
    this.providers.set(id, provider);
    this.logger.log(`Registered provider: ${id} (${provider.type})`);
    return provider;
  }

  /**
   * Unregister a provider
   * @param id The provider ID
   * @returns Whether the provider was unregistered
   */
  unregisterProvider(id: string): boolean {
    const result = this.providers.delete(id);
    if (result) {
      this.logger.log(`Unregistered provider: ${id}`);
    }
    return result;
  }

  /**
   * Create a provider instance
   * @param type The provider type
   * @param options The provider options
   * @returns The created provider instance
   */
  createProvider(type: ProviderType, options: AIProviderOptions): AIProvider {
    switch (type) {
      case ProviderType.OPENAI:
        return new OpenAIProviderService(options);
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
