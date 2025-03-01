# Contently LLM Analytics Testing Infrastructure

This document provides a comprehensive overview of the testing infrastructure for the Contently LLM Analytics platform.

## Testing Framework

The testing infrastructure is built on Jest, a popular JavaScript testing framework. The tests are organized into three main categories:

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End (E2E) Tests**: Test complete workflows from start to finish

## Test Directory Structure

```
contently-llm-analytics/
├── src/
│   └── modules/
│       ├── ai-provider/
│       │   └── __tests__/
│       │       ├── unit/
│       │       └── integration/
│       ├── answer-engine/
│       │   └── __tests__/
│       │       ├── unit/
│       │       └── integration/
│       └── conversation-explorer/
│           └── __tests__/
│               ├── unit/
│               └── integration/
├── test/
│   ├── e2e/
│   │   ├── ai-analytics-workflow.e2e-spec.ts
│   │   └── README.md
│   └── setup.ts
├── scripts/
│   ├── run-all-tests.ps1
│   ├── run-all-tests-with-output.ps1
│   ├── run-e2e-tests.ps1
│   ├── run-tests-with-output.ps1
│   └── run-ai-workflow-tests.ps1
└── jest-e2e.config.js
```

## Test Configuration

### Jest Configuration

The project uses two Jest configuration files:

1. **Default Jest Configuration**: Used for unit and integration tests
2. **E2E Jest Configuration**: Used for end-to-end tests (`jest-e2e.config.js`)

### Environment Variables

Tests use environment variables defined in `.env.test`:

```
OPENAI_API_KEY=sk-test-key
OPENAI_DEFAULT_MODEL=gpt-4
OPENAI_DEFAULT_TEMPERATURE=0.7
OPENAI_TIMEOUT_MS=30000
OPENAI_MAX_RETRIES=3
```

## Test Scripts

The project includes several PowerShell scripts to run tests:

### Basic Test Scripts

- **`run-all-tests.ps1`**: Runs all tests (unit, integration, and E2E)
- **`run-e2e-tests.ps1`**: Runs all E2E tests
- **`run-ai-workflow-tests.ps1`**: Runs only the AI analytics workflow E2E tests

### Output-Capturing Test Scripts

- **`run-all-tests-with-output.ps1`**: Runs all tests and saves output to a file
- **`run-tests-with-output.ps1`**: Runs E2E tests and saves output to a file

Output files are saved in the `test-results` directory with timestamps:
- `all-test-results_YYYY-MM-DD_HH-MM-SS.txt`
- `e2e-test-results_YYYY-MM-DD_HH-MM-SS.txt`
- `ai-workflow-test-results_YYYY-MM-DD_HH-MM-SS.txt`

## E2E Testing

### AI Analytics Workflow E2E Tests

The E2E tests validate the complete AI analytics workflow:

1. **AI Provider**: Generates AI content based on prompts
2. **Answer Engine**: Analyzes customer reviews and extracts insights
3. **Conversation Explorer**: Analyzes customer conversations and extracts topics
4. **Embeddings**: Generates embeddings for semantic search

### Mock Implementations

The E2E tests use mock implementations to avoid external dependencies:

- **`MockOpenAIProvider`**: Simulates AI content generation
- **`MockAnswerEngineRunner`**: Simulates review analysis
- **`MockConversationExplorerRunner`**: Simulates conversation analysis

### Test Cases

The E2E tests include the following test cases:

1. **Customer Review Analysis**: Tests the processing of a customer review through the entire analytics pipeline
2. **Customer Conversation Analysis**: Tests the processing of a customer conversation through the entire analytics pipeline
3. **Complete End-to-End Workflow**: Tests the processing of both review and conversation analysis, including finding common topics

## Unit Testing

Unit tests focus on testing individual components in isolation:

- **AI Provider**: Tests the AI provider factory and services
- **Answer Engine**: Tests the answer engine runner and services
- **Conversation Explorer**: Tests the conversation explorer runner and services

## Integration Testing

Integration tests focus on testing interactions between components:

- **AI Provider Integration**: Tests the integration of the AI provider with other components
- **Answer Engine Integration**: Tests the integration of the answer engine with other components
- **Conversation Explorer Integration**: Tests the integration of the conversation explorer with other components

## Running Tests

### Using PowerShell Scripts

```powershell
# Run all tests
.\scripts\run-all-tests.ps1

# Run E2E tests only
.\scripts\run-e2e-tests.ps1

# Run AI workflow tests only
.\scripts\run-ai-workflow-tests.ps1

# Run tests with output to file
.\scripts\run-tests-with-output.ps1
.\scripts\run-all-tests-with-output.ps1
```

### Using npm Scripts

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run test coverage
npm run test:cov
```

## Test Coverage

The project aims for high test coverage:

- **Unit Tests**: 90% coverage minimum
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

## Adding New Tests

### Adding Unit Tests

1. Create a new test file in the appropriate `__tests__/unit` directory
2. Import the component to test
3. Write test cases using Jest's `describe` and `test` functions
4. Run the tests using `npm run test`

### Adding Integration Tests

1. Create a new test file in the appropriate `__tests__/integration` directory
2. Import the components to test
3. Write test cases using Jest's `describe` and `test` functions
4. Run the tests using `npm run test:integration`

### Adding E2E Tests

1. Create a new test file in the `test/e2e` directory
2. Import the necessary components and mock implementations
3. Write test cases using Jest's `describe` and `test` functions
4. Run the tests using `npm run test:e2e`

## Best Practices

1. **Keep Tests Independent**: Each test should be independent of other tests
2. **Use Mock Implementations**: Use mock implementations to avoid external dependencies
3. **Test Edge Cases**: Test both happy paths and edge cases
4. **Maintain Test Coverage**: Ensure that new features are covered by tests
5. **Update Documentation**: Update the test documentation when adding new tests

## Conclusion

The testing infrastructure for the Contently LLM Analytics platform provides a solid foundation for ensuring the reliability and correctness of the platform. The combination of unit, integration, and E2E tests ensures that the platform works as expected at all levels.

The modular design of the testing infrastructure allows for easy extension and maintenance as the platform evolves. The comprehensive documentation ensures that developers can effectively use the testing infrastructure to maintain and improve the platform. 