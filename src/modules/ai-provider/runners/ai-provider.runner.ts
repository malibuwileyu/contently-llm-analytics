import { Injectable } from '@nestjs/common';
import { AIProviderFactoryService } from '../services/ai-provider-factory.service';
import {
  ProviderType,
  AIProviderResponse,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class AIProviderRunner {
  constructor(private readonly factoryService: AIProviderFactoryService) {}

  async run(
    providerType: ProviderType,
    operation: 'chat' | 'complete',
    input: string | Array<{ role: string; content: string }>,
  ): Promise<AIProviderResponse<unknown>> {
    const provider = this.factoryService.getProvider(providerType);

    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw new Error(`Provider ${providerType} is not available`);
    }

    if (operation === 'chat' && Array.isArray(input)) {
      return provider.chat(input);
    } else if (operation === 'complete' && typeof input === 'string') {
      return provider.complete(input);
    }

    throw new Error(
      `Invalid operation ${operation} or input type for provider ${providerType}`,
    );
  }
}
