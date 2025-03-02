# AI Provider Module

The AI Provider Module is a flexible and extensible system for integrating multiple AI service providers into your application. It provides a unified interface for interacting with different AI services such as OpenAI, Perplexity, and SerpAPI.

## Features

- **Unified Interface**: Interact with multiple AI providers through a consistent API
- **Provider Management**: Dynamically register, unregister, and retrieve AI providers
- **Operation Types**: Support for chat completions, text completions, embeddings, and search operations
- **Configurable**: Easy configuration through environment variables
- **Fault Tolerance**: Built-in retry mechanisms and error handling
- **Extensible**: Simple to add new AI providers by implementing the base interface

## Architecture

The module follows a modular architecture with the following components:

- **Interfaces**: Define the contract for AI providers and their operations
- **Services**: Implement the provider-specific logic for each AI service
- **Factory**: Manages the initialization and registration of providers
- **Runner**: Orchestrates operations across available providers
- **Configuration**: Centralizes provider-specific settings

## Usage

### Basic Usage

```typescript
import { Injectable } from '@nestjs/common';
import { AIProviderRunner, ProviderType, AIProviderOperationType } from '../modules/ai-provider';

@Injectable()
export class YourService {
  constructor(private readonly aiProviderRunner: AIProviderRunner) {}

  async generateChatResponse(userMessage: string): Promise<string> {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: userMessage }
    ];

    const result = await this.aiProviderRunner.run({
      providerType: ProviderType.OPENAI,
      operationType: AIProviderOperationType.CHAT,
      input: messages,
      options: {
        temperature: 0.7,
        maxTokens: 500
      }
    });

    return result;
  }
}
```

### Getting Available Providers

```typescript
async getProviders() {
  const providers = await this.aiProviderRunner.getAvailableProviders();
  return providers;
}
```

### Registering a Custom Provider

```typescript
async registerCustomProvider() {
  const customProvider = new CustomOpenAIProvider({
    apiKey: 'your-api-key',
    // other options
  });

  await this.aiProviderRunner.registerProvider(
    ProviderType.OPENAI,
    'custom-provider-name',
    customProvider
  );
}
```

## Configuration

Configure the AI providers through environment variables:

### OpenAI Configuration

```
OPENAI_API_KEYS=key1,key2,key3
OPENAI_ORGANIZATION_ID=org-123
OPENAI_DEFAULT_MODEL=gpt-4
OPENAI_DEFAULT_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_RETRIES=3
```

### Perplexity Configuration

```
PERPLEXITY_API_KEYS=key1,key2
PERPLEXITY_DEFAULT_MODEL=llama-3-sonet-8b
PERPLEXITY_DEFAULT_TEMPERATURE=0.7
PERPLEXITY_TIMEOUT_MS=30000
PERPLEXITY_MAX_RETRIES=3
```

### SerpAPI Configuration

```
SERPAPI_API_KEYS=key1,key2
SERPAPI_DEFAULT_ENGINE=google
SERPAPI_DEFAULT_NUM_RESULTS=10
SERPAPI_DEFAULT_COUNTRY=us
SERPAPI_DEFAULT_LANGUAGE=en
SERPAPI_TIMEOUT_MS=30000
SERPAPI_MAX_RETRIES=3
```

## Supported Providers

### OpenAI

Supports:
- Chat completions
- Text completions
- Embeddings

### Perplexity

Supports:
- Chat completions
- Text completions

### SerpAPI

Supports:
- Web search

## Adding a New Provider

1. Create a new interface extending `AIProvider`
2. Implement a new service class extending `BaseAIProvider`
3. Update the factory service to initialize the new provider
4. Add the provider type to the `ProviderType` enum

Example:

```typescript
// 1. Create interface
export interface AnthropicProviderOptions extends AIProviderOptions {
  model?: AnthropicModelType;
}

// 2. Implement service
@Injectable()
export class AnthropicProviderService extends BaseAIProvider {
  constructor() {
    super('anthropic');
  }

  // Implement required methods
}

// 3. Update factory
private initializeAnthropicProvider(): void {
  // Implementation
}

// 4. Add to enum
export enum ProviderType {
  OPENAI = 'openai',
  PERPLEXITY = 'perplexity',
  SERPAPI = 'serpapi',
  ANTHROPIC = 'anthropic'
}
```

## Error Handling

The module includes comprehensive error handling:

- Provider-specific errors are wrapped in a common error format
- Retry mechanisms for transient failures
- Fallback to alternative providers when available
- Detailed logging for troubleshooting

## Examples

See the `examples` directory for complete usage examples:

- Basic chat completion
- Text completion
- Embedding generation
- Web search
- Provider management

## Dependencies

- NestJS framework
- OpenAI Node.js client
- Perplexity API client
- SerpAPI Node.js client 