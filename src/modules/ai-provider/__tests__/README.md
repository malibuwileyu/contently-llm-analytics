# AI Provider Module Testing

This directory contains tests for the AI Provider module. The tests are designed to work with minimal configuration, requiring only an OpenAI API key for the integration tests.

## Test Structure

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test components working together with the Answer Engine and Conversation Explorer
- **Mock Tests**: Test using mock implementations (no API keys required)

## Environment Variables

The tests use the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
OPENAI_ORGANIZATION_ID=your_org_id (optional)
OPENAI_DEFAULT_MODEL=gpt-3.5-turbo (default)
OPENAI_DEFAULT_TEMPERATURE=0.7 (default)
OPENAI_TIMEOUT_MS=10000 (default)
OPENAI_MAX_RETRIES=1 (default)
```

## Running Tests

### Using PowerShell Script

The easiest way to run the tests is using the provided PowerShell scripts:

```powershell
# Run all tests
./run-tests.ps1

# Run integration tests only
./run-integration-tests.ps1
```

These scripts will:
1. Check if the required environment variables are set
2. Prompt you to set the OpenAI API key if not already set
3. Run the mock tests (no API key required)
4. Run the integration tests if an API key is available

### Running Tests Manually

You can also run the tests manually using Jest:

```bash
# Run all tests
npx jest --config jest.config.js "src/modules/ai-provider/__tests__"

# Run only mock tests (no API key required)
npx jest --config jest.config.js "src/modules/ai-provider/__tests__/services/ai-provider-factory.mock.spec.ts"

# Run integration tests
npx jest --config jest.config.js "src/modules/ai-provider/__tests__/integration"

# Run specific test file
npx jest --config jest.config.js "src/modules/ai-provider/__tests__/services/openai-provider.service.spec.ts"
```

## Test Files

### Unit Tests
- `ai-provider.module.spec.ts`: Tests for the AI Provider module
- `services/openai-provider.service.spec.ts`: Tests for the OpenAI provider service
- `services/ai-provider-factory.service.spec.ts`: Tests for the AI provider factory service
- `runners/ai-provider.runner.spec.ts`: Tests for the AI provider runner

### Mock Tests
- `services/ai-provider-factory.mock.spec.ts`: Mock tests for the AI provider factory service
- `mocks/ai-provider.mock.ts`: Mock implementation of the AI provider interface
- `integration/ai-provider-mock-integration.spec.ts`: Mock integration tests with Answer Engine and Conversation Explorer

### Integration Tests
- `integration/ai-provider-real-integration.spec.ts`: Real integration tests using the OpenAI API
- `integration/ai-provider-integration.spec.ts`: Integration tests with Answer Engine and Conversation Explorer

## Integration with Answer Engine and Conversation Explorer

The integration tests demonstrate how to:

1. Use the AI Provider to generate content (reviews, conversations, etc.)
2. Pass the generated content to the Answer Engine for analysis
3. Generate conversations and analyze them with the Conversation Explorer
4. Generate embeddings for semantic search and similarity analysis

This workflow shows the complete pipeline from content generation to analysis, which is a key part of the Contently LLM Analytics system.

## Adding More Provider Tests

When you have API keys for other providers (Perplexity, SerpAPI), you can add similar test files for those providers. The test structure would be similar to the OpenAI provider tests.

### Example for Perplexity:

```typescript
// services/perplexity-provider.service.spec.ts
import { PerplexityProviderService } from '../../services/perplexity-provider.service';
import { PerplexityProviderOptions } from '../../interfaces';

describe('PerplexityProviderService', () => {
  let service: PerplexityProviderService;
  const apiKey = process.env.PERPLEXITY_API_KEY;

  beforeEach(() => {
    // Skip tests if no API key is available
    if (!apiKey) {
      console.warn('No PERPLEXITY_API_KEY found in environment, skipping Perplexity provider tests');
      return;
    }

    const options: PerplexityProviderOptions = {
      apiKey,
      // other options
    };

    service = new PerplexityProviderService(options);
  });

  // Tests similar to OpenAI provider tests
});
```

## Test Coverage

The tests aim to cover:

- Provider initialization and configuration
- Provider capabilities and availability
- Provider operations (chat, complete, embed, search)
- Factory service provider management
- Runner orchestration of operations
- Integration with Answer Engine and Conversation Explorer
- Error handling and edge cases

## Mocking Strategy

For tests that don't require actual API calls, we use the `MockAIProvider` class that implements the `AIProvider` interface. This allows us to test the factory service and runner without making actual API calls. 