import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIProviderService } from './openai-provider.service';
import { AIProvider, ProviderType } from '../interfaces/ai-provider.interface';

@Injectable()
export class AIProviderFactoryService {
  constructor(
    private readonly configService: ConfigService,
    private readonly openAIProvider: OpenAIProviderService,
  ) {}

  getProvider(type: ProviderType): AIProvider {
    switch (type) {
      case ProviderType.OPENAI:
        return this.openAIProvider;
      default:
        throw new Error(`Unsupported provider type: ${type}`);
    }
  }
}
