import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProviderFactoryService } from './ai-provider-factory.service';
import { OpenAIProviderService } from './openai-provider.service';
import {
  AIProviderOptions,
  ProviderType,
} from '../interfaces/ai-provider.interface';

/**
 * Service responsible for registering AI providers
 */
@Injectable()
export class AIProviderRegistrationService implements OnModuleInit {
  private readonly logger = new Logger(AIProviderRegistrationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly factoryService: AIProviderFactoryService,
  ) {}

  /**
   * Register providers on module initialization
   */
  onModuleInit(): void {
    this.logger.log('Initializing AI Provider Registration Service');
    this.registerProviders();
  }

  /**
   * Register all configured providers
   */
  private registerProviders(): void {
    this.registerOpenAIProviders();
    // Future: this.registerPerplexityProviders();
    // Future: this.registerSerpAPIProviders();
  }

  /**
   * Register OpenAI providers
   */
  private registerOpenAIProviders(): void {
    const openaiConfig = this.configService.get('ai.openai');

    // Check if we have a direct API key in the environment
    const directApiKey = process.env.OPENAI_API_KEY;
    if (directApiKey) {
      this.logger.log('Registering OpenAI provider with direct API key');
      this.registerOpenAIProvider(directApiKey, openaiConfig);
      return;
    }

    // Otherwise use the config from ai.openai.apiKeys
    if (openaiConfig?.apiKeys?.length > 0) {
      this.logger.log(
        `Registering ${openaiConfig.apiKeys.length} OpenAI providers`,
      );

      openaiConfig.apiKeys.forEach((apiKey: string, index: number) => {
        this.registerOpenAIProvider(apiKey, openaiConfig, index);
      });
    } else {
      this.logger.warn('No OpenAI API keys configured');
    }
  }

  /**
   * Register a single OpenAI provider
   */
  private registerOpenAIProvider(
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
      this.factoryService.registerProvider(providerId, provider);
      this.logger.log(`Registered OpenAI provider: ${providerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to register OpenAI provider: ${error.message}`,
        error.stack,
      );
    }
  }
}
