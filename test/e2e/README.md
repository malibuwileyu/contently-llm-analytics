# End-to-End Tests for AI Analytics Workflow

This directory contains end-to-end tests that verify the complete workflow from AI output ingestion through the answer engine and conversation explorer.

## Overview

The E2E tests validate the following flow:

1. **AI Provider** generates content (reviews, conversations)
2. **Answer Engine** analyzes content for sentiment, topics, and entities
3. **Conversation Explorer** analyzes conversations for intents, topics, and sentiment
4. **Embeddings** are generated for semantic search

## Test Files

- `ai-analytics-workflow.e2e-spec.ts`: Main E2E test file that tests the complete workflow

## Running the Tests

To run the E2E tests, use the following command from the project root:

```bash
# PowerShell
./scripts/run-e2e-tests.ps1

# Or directly with Jest
npx jest --config jest-e2e.config.js test/e2e/ai-analytics-workflow.e2e-spec.ts
```

## Test Environment

The tests use mock implementations of the following components:

- **MockOpenAIProvider**: Simulates responses from the OpenAI API
- **MockAnswerEngineRunner**: Simulates the Answer Engine analysis
- **MockConversationExplorerRunner**: Simulates the Conversation Explorer analysis

## Test Cases

1. **Customer Review Analysis**
   - Generate a customer review using AI Provider
   - Analyze the review with Answer Engine
   - Generate embeddings for semantic search

2. **Customer Conversation Analysis**
   - Generate a customer conversation using AI Provider
   - Parse the conversation into messages
   - Analyze the conversation with Conversation Explorer
   - Get conversation trends for the brand
   - Generate embeddings for semantic search

3. **Complete End-to-End Workflow**
   - Generate a customer review
   - Analyze the review with Answer Engine
   - Generate a conversation based on the review
   - Analyze the conversation with Conversation Explorer
   - Compare insights from both analyses
   - Generate embeddings for both the review and conversation

## Adding New Tests

To add new E2E tests:

1. Create a new test file in this directory with the `.e2e-spec.ts` extension
2. Import the necessary components and mock implementations
3. Write test cases that verify the complete workflow
4. Update this README to document the new tests 