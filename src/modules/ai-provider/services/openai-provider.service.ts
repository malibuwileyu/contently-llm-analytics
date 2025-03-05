import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { BaseAIProvider } from './base-ai-provider.service';
import { AIProviderConfig } from '../config/ai-provider.config';
import {
  AIProviderResponse,
  OpenAIModelType,
  OpenAIProviderOptions,
  AIProviderCapabilities,
  ProviderType,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIProviderService
  extends BaseAIProvider
  implements OnModuleDestroy
{
  private client: OpenAI;
  private options: OpenAIProviderOptions;

  constructor(private readonly configService: ConfigService) {
    super();
    const config = this.configService.get<AIProviderConfig>('ai');
    this.options = {
      apiKey: config.openai.apiKey,
      organization: config.openai.organization,
      defaultModel:
        (config.openai.defaultModel as OpenAIModelType) || OpenAIModelType.GPT4,
      timeout: config.openai.timeout || 30000,
    };
    this.client = new OpenAI({
      apiKey: this.options.apiKey,
      organization: this.options.organization,
      timeout: this.options.timeout,
    });
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  async cleanup() {
    // Close any open connections or resources
    if (this.client) {
      // OpenAI client doesn't have a close method yet
      // but we'll keep this for future compatibility
      this.client = null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      return false;
    }
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      type: ProviderType.OPENAI,
      models: Object.values(OpenAIModelType),
      features: {
        chat: true,
        completion: true,
        embedding: true,
        imageGeneration: true,
        imageAnalysis: true,
      },
    };
  }

  async chat(
    messages: Array<{ role: string; content: string }>,
  ): Promise<AIProviderResponse> {
    try {
      const startTime = Date.now();
      const response = await this.client.chat.completions.create({
        model: this.options.defaultModel,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content,
        })),
        temperature: 0.7,
      });
      const endTime = Date.now();

      return {
        content: response.choices[0].message.content,
        metadata: {
          model: response.model,
          provider: ProviderType.OPENAI,
          tokens: {
            prompt: response.usage.prompt_tokens,
            completion: response.usage.completion_tokens,
            total: response.usage.total_tokens,
          },
          latency: endTime - startTime,
        },
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async complete(prompt: string): Promise<AIProviderResponse> {
    return this.chat([{ role: 'user', content: prompt }]);
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      return new Error(
        `OpenAI API error: ${error.response.status} - ${error.response.data.error.message}`,
      );
    }
    return new Error(`OpenAI error: ${error.message}`);
  }
}
