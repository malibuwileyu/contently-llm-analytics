import {
  AIProvider,
  AIProviderCapabilities,
  AIProviderResponse,
} from '../interfaces/ai-provider.interface';

export abstract class BaseAIProvider implements AIProvider {
  abstract isAvailable(): Promise<boolean>;
  abstract getCapabilities(): AIProviderCapabilities;
  abstract chat(
    messages: Array<{ role: string; content: string }>,
  ): Promise<AIProviderResponse>;
  abstract complete(prompt: string): Promise<AIProviderResponse>;
  embed?(text: string): Promise<number[]>;
  cleanup?(): Promise<void>;
}
