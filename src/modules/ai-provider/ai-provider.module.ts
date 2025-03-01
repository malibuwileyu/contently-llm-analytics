import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIProviderFactoryService } from './services/ai-provider-factory.service';
import { AIProviderRunner } from './runners/ai-provider.runner';
import aiProviderConfig from './config/ai-provider.config';

/**
 * AI provider module
 */
@Module({
  imports: [ConfigModule.forFeature(aiProviderConfig)],
  providers: [AIProviderFactoryService, AIProviderRunner],
  exports: [AIProviderFactoryService, AIProviderRunner],
})
export class AIProviderModule {}
