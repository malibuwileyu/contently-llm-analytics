import { Injectable, Logger } from '@nestjs/common';
import { AIProviderRunner } from '../runners/ai-provider.runner';
import { ProviderType } from '../services/ai-provider-factory.service';
import {
  AIProviderOperationType,
  ChatMessage,
  ChatOptions,
  CompletionOptions,
  EmbeddingOptions,
  SearchOptions,
} from '../interfaces/ai-provider.interface';

/**
 * Example service demonstrating how to use the AI Provider module
 * This is for demonstration purposes only and not meant to be used in production
 */
@Injectable()
export class AIProviderExampleService {
  private readonly logger = new Logger(AIProviderExampleService.name);

  constructor(private readonly aiProviderRunner: AIProviderRunner) {}

  /**
   * Example of how to use the chat completion functionality
   */
  async exampleChatCompletion(): Promise<void> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Tell me about artificial intelligence.' },
      ];

      const options: ChatOptions = {
        temperature: 0.7,
        maxTokens: 500,
      };

      const result = await this.aiProviderRunner.run({
        providerType: ProviderType.OPENAI,
        operationType: AIProviderOperationType.CHAT,
        input: messages,
        options,
      });

      this.logger.log('Chat completion result:', result);
    } catch (error) {
      this.logger.error('Error in chat completion example:', error);
    }
  }

  /**
   * Example of how to use the text completion functionality
   */
  async exampleTextCompletion(): Promise<void> {
    try {
      const prompt = 'Write a short poem about technology:';

      const options: CompletionOptions = {
        temperature: 0.8,
        maxTokens: 200,
      };

      const result = await this.aiProviderRunner.run({
        providerType: ProviderType.PERPLEXITY,
        operationType: AIProviderOperationType.COMPLETE,
        input: prompt,
        options,
      });

      this.logger.log('Text completion result:', result);
    } catch (error) {
      this.logger.error('Error in text completion example:', error);
    }
  }

  /**
   * Example of how to use the embedding functionality
   */
  async exampleEmbedding(): Promise<void> {
    try {
      const text = 'This is a sample text to generate embeddings for.';

      const options: EmbeddingOptions = {
        model: 'text-embedding-ada-002',
      };

      const result = await this.aiProviderRunner.run({
        providerType: ProviderType.OPENAI,
        operationType: AIProviderOperationType.EMBED,
        input: text,
        options,
      });

      this.logger.log('Embedding result (truncated):', {
        dimensions: result.length,
        sample: result.slice(0, 5),
      });
    } catch (error) {
      this.logger.error('Error in embedding example:', error);
    }
  }

  /**
   * Example of how to use the search functionality
   */
  async exampleSearch(): Promise<void> {
    try {
      const query = 'latest advancements in artificial intelligence';

      const options: SearchOptions = {
        numResults: 5,
        country: 'us',
        language: 'en',
      };

      const result = await this.aiProviderRunner.run({
        providerType: ProviderType.SERPAPI,
        operationType: AIProviderOperationType.SEARCH,
        input: query,
        options,
      });

      this.logger.log('Search result:', result);
    } catch (error) {
      this.logger.error('Error in search example:', error);
    }
  }

  /**
   * Example of how to get all available providers
   */
  async exampleGetAvailableProviders(): Promise<void> {
    try {
      const providers = await this.aiProviderRunner.getAvailableProviders();
      this.logger.log('Available providers:', providers);
    } catch (error) {
      this.logger.error('Error getting available providers:', error);
    }
  }

  /**
   * Example of how to register a custom provider
   */
  async exampleRegisterCustomProvider(): Promise<void> {
    try {
      // This would be your custom implementation of the OpenAI provider
      // with specific configuration
      const customOpenAIProvider = {
        // Implementation details would go here
      };

      await this.aiProviderRunner.registerProvider(
        ProviderType.OPENAI,
        'custom-openai',
        customOpenAIProvider as any, // Type casting for example purposes
      );

      this.logger.log('Custom provider registered successfully');
    } catch (error) {
      this.logger.error('Error registering custom provider:', error);
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    this.logger.log('Running AI Provider examples...');

    await this.exampleGetAvailableProviders();
    await this.exampleChatCompletion();
    await this.exampleTextCompletion();
    await this.exampleEmbedding();
    await this.exampleSearch();

    this.logger.log('All examples completed');
  }
}
