# Contently LLM Analytics

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Contently LLM Analytics is a platform for analyzing customer reviews and conversations using AI. It leverages large language models to extract insights, sentiment, topics, and trends from customer feedback.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing Infrastructure

The project includes a comprehensive testing infrastructure with unit tests, integration tests, and end-to-end (E2E) tests.

### Test Types

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete workflows from start to finish

### Running Tests

```bash
# Run all tests (unit, integration, and E2E)
$ ./scripts/run-all-tests.ps1

# Run all tests with detailed output to a file
$ ./scripts/run-all-tests-with-output.ps1

# Run unit tests only
$ npm run test

# Run integration tests only
$ npm run test:integration

# Run E2E tests only
$ npm run test:e2e

# Run AI analytics workflow E2E tests only
$ ./scripts/run-ai-workflow-tests.ps1

# Run E2E tests with output to a file
$ ./scripts/run-tests-with-output.ps1

# Test coverage
$ npm run test:cov
```

### Test Output Files

When using the scripts that save output to files, the results are stored in the `test-results` directory with timestamps:

- `all-test-results_YYYY-MM-DD_HH-MM-SS.txt`: Results from running all tests
- `e2e-test-results_YYYY-MM-DD_HH-MM-SS.txt`: Results from running E2E tests
- `ai-workflow-test-results_YYYY-MM-DD_HH-MM-SS.txt`: Results from running AI workflow tests

### Test Structure

- **Unit Tests**: Located in `__tests__/unit` directories within each module
- **Integration Tests**: Located in `__tests__/integration` directories within each module
- **E2E Tests**: Located in `test/e2e` directory at the project root

### Key Test Files

- **AI Provider Tests**: `src/modules/ai-provider/__tests__/`
- **Answer Engine Tests**: `src/modules/answer-engine/__tests__/`
- **Conversation Explorer Tests**: `src/modules/conversation-explorer/tests/`
- **E2E Workflow Tests**: `test/e2e/ai-analytics-workflow.e2e-spec.ts`

### E2E Testing

The E2E tests validate complete workflows from AI output ingestion through the answer engine and conversation explorer. These tests ensure that the entire analytics pipeline functions correctly.

For more information about the E2E tests, see the [E2E Test README](test/e2e/README.md).

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

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
- `run-e2e-tests.ps1`: Runs all E2E tests.
- `run-all-tests.ps1`: Runs all tests (unit, integration, and E2E).

```powershell
# Run from the project root
powershell -ExecutionPolicy Bypass -File .\scripts\run-integration-tests.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run-e2e-tests.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\run-all-tests.ps1
```

### Running Tests Manually

You can also run the tests manually using Jest:

```powershell
# Run all tests
npx jest

# Run mock tests only
npx jest "src/modules/ai-provider/__tests__/services/ai-provider-factory.mock.spec.ts"
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-mock-integration.spec.ts"

# Run integration tests only
npx jest "src/modules/ai-provider/__tests__/integration/ai-provider-real-integration.spec.ts"

# Run E2E tests only
npx jest --config=jest-e2e.config.js
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
