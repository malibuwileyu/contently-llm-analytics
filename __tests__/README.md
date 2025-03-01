# AI Provider Module Tests

This directory contains tests for the AI Provider module. The tests are designed to validate the functionality of the AI Provider module with minimal configuration.

## Test Structure

The tests are organized into the following categories:

### Mock Tests

Mock tests use mock implementations of the AI Provider services and do not require actual API keys. These tests validate the basic functionality of the module without making actual API calls.

- `services/ai-provider-factory.mock.spec.ts`: Tests the AI Provider Factory service with mock providers.
- `integration/ai-provider-mock-integration.spec.ts`: Tests the integration of the AI Provider module with mock implementations.

### Integration Tests

Integration tests use real API calls to validate the functionality of the module. These tests require an OpenAI API key to run.

- `integration/ai-provider-real-integration.spec.ts`: Tests the integration of the AI Provider module with real API calls.

## Environment Variables

The following environment variables are used by the tests:

- `OPENAI_API_KEY`: Required for integration tests. Your OpenAI API key.
- `OPENAI_ORGANIZATION_ID`: Optional. Your OpenAI organization ID.
- `OPENAI_DEFAULT_MODEL`: Optional. The default model to use for OpenAI. Defaults to `gpt-3.5-turbo`.
- `OPENAI_DEFAULT_TEMPERATURE`: Optional. The default temperature to use for OpenAI. Defaults to `0.7`.
- `OPENAI_TIMEOUT_MS`: Optional. The timeout in milliseconds for OpenAI requests. Defaults to `30000`.
- `OPENAI_MAX_RETRIES`: Optional. The maximum number of retries for OpenAI requests. Defaults to `3`.

## Running Tests

### Using PowerShell Scripts

The easiest way to run the tests is to use the provided PowerShell scripts:

- `run-integration-tests.ps1`: Runs all integration tests.

```powershell
# Run from the __tests__ directory
powershell -ExecutionPolicy Bypass -File .\run-integration-tests.ps1
```

### Running Tests Manually

You can also run the tests manually using Jest:

```powershell
# Run all tests
npx jest "src/modules/ai-provider/__tests__"

# Run mock tests only
npx jest "src/modules/ai-provider/__tests__/services/ai-provider-factory.mock.spec.ts"
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-mock-integration.spec.ts"

# Run integration tests only
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-real-integration.spec.ts"
```

## Test Files

- `services/ai-provider-factory.mock.spec.ts`: Tests the AI Provider Factory service with mock providers.
- `integration/ai-provider-mock-integration.spec.ts`: Tests the integration of the AI Provider module with mock implementations.
- `integration/ai-provider-real-integration.spec.ts`: Tests the integration of the AI Provider module with real API calls.
- `run-integration-tests.ps1`: PowerShell script to run integration tests.
- `.env.test.example`: Example environment variables for testing.

## Adding More Provider Tests

To add tests for additional providers like Perplexity and SerpAPI, follow these steps:

1. Create mock implementations of the providers in the mock integration test file.
2. Add test cases for the new providers in the real integration test file.
3. Update the environment variables in `.env.test` to include the new provider's API keys.

Example structure for Perplexity provider:

```typescript
// Mock implementation
if (context.type === 'perplexity') {
  if (context.operation === OperationType.CHAT) {
    return {
      data: {
        text: "Perplexity response...",
        choices: ["Perplexity response..."]
      },
      metadata: {
        provider: 'Perplexity',
        model: 'llama-3-8b-instruct',
        timestamp: new Date(),
        latencyMs: 300,
        usage: {
          promptTokens: 30,
          completionTokens: 180,
          totalTokens: 210
        }
      }
    };
  }
}
```

## Test Coverage

The tests cover the following aspects of the AI Provider module:

- Provider initialization and configuration
- Provider capabilities and availability
- Provider operations (chat, complete, embed, search)
- Error handling and fallback mechanisms
- Integration with other modules (Answer Engine, Conversation Explorer)

## Mocking Strategy

For tests that do not require actual API calls, we use mock implementations of the AI Provider services. These mocks simulate the behavior of the real services without making actual API calls.

The `MockAIProvider` class implements the `AIProvider` interface and provides mock implementations of the provider methods. This allows us to test the module's functionality without requiring actual API keys. 