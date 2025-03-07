import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIProviderService } from './services/openai-provider.service';

/**
 * AI provider module for managing different AI service providers
 * Supports OpenAI, Perplexity, and SerpAPI integrations
 */
@Module({
  imports: [ConfigModule],
  providers: [OpenAIProviderService],
  exports: [OpenAIProviderService],
})
export class AIProviderModule {}
