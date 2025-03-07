import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { BaseAIProvider } from './base-ai-provider.service';
import { AIProviderCapabilities, AIProviderResponse, ProviderType } from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIProviderService extends BaseAIProvider {
  private readonly logger = new Logger(OpenAIProviderService.name);
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    super();
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OpenAI API key not found in configuration');
      throw new Error('OpenAI API key not found');
    }
    this.client = new OpenAI({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch (error) {
      this.logger.error('Error checking OpenAI availability:', error);
      return false;
    }
  }

  getCapabilities(): AIProviderCapabilities {
    return {
      type: ProviderType.OPENAI,
      models: ['gpt-4', 'text-embedding-ada-002'],
      features: {
        chat: true,
        completion: true,
        embedding: true,
        imageGeneration: false,
        imageAnalysis: false
      }
    };
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<AIProviderResponse> {
    const startTime = Date.now();
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: messages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        })),
        temperature: 0.7
      });

      const latency = Date.now() - startTime;

      return {
        content: response.choices[0]?.message?.content || '',
        metadata: {
          provider: ProviderType.OPENAI,
          latency,
          model: response.model,
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          }
        }
      };
    } catch (error) {
      this.logger.error('Error in chat operation:', error);
      throw error;
    }
  }

  async complete(prompt: string): Promise<AIProviderResponse> {
    const startTime = Date.now();
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      const latency = Date.now() - startTime;

      return {
        content: response.choices[0]?.message?.content || '',
        metadata: {
          provider: ProviderType.OPENAI,
          latency,
          model: response.model,
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          }
        }
      };
    } catch (error) {
      this.logger.error('Error in complete operation:', error);
      throw error;
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });

      return response.data[0]?.embedding || [];
    } catch (error) {
      this.logger.error('Error in embed operation:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    // No cleanup needed for OpenAI
  }
}
