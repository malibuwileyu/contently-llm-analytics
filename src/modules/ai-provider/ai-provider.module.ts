import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIProviderService } from './services/openai-provider.service';
import { AIProviderFactoryService } from './services/ai-provider-factory.service';
import { AIProviderRunner } from './runners/ai-provider.runner';
import aiProviderConfig from './config/ai-provider.config';

/**
 * AI provider module for managing different AI service providers
 * Supports OpenAI, Perplexity, and SerpAPI integrations
 */
@Module({
  imports: [ConfigModule.forFeature(aiProviderConfig)],
  providers: [
    OpenAIProviderService,
    AIProviderFactoryService,
    AIProviderRunner,
  ],
  exports: [AIProviderFactoryService, OpenAIProviderService, AIProviderRunner],
})
export class AIProviderModule {}
