# Answer Generator Module

The Answer Generator module is responsible for generating AI-powered answers based on search queries, validating their quality, scoring them based on various metrics, and storing the data for analytics.

## Core Functionality

- Generate answers from AI providers based on search queries
- Validate answer quality and relevance
- Score answers based on predefined metrics
- Store answer data and metadata for analytics

## Module Structure

```
answer-generator/
├── dto/                  # Data Transfer Objects
├── entities/             # Database entities
├── interfaces/           # TypeScript interfaces
├── repositories/         # Database repositories
├── runners/              # Orchestration runners
├── services/             # Business logic services
└── __tests__/            # Unit and integration tests
```

## Key Components

### Entities

- **Answer**: Represents a generated answer with scoring and validation data
- **AnswerMetadata**: Stores additional metadata about answers, such as citations

### Services

- **AnswerGeneratorService**: Generates answers from AI providers
- **AnswerValidatorService**: Validates answer quality and relevance
- **AnswerScoringService**: Scores answers based on various metrics

### Repositories

- **AnswerRepository**: Handles database operations for Answer entities
- **AnswerMetadataRepository**: Handles database operations for AnswerMetadata entities

### Runner

- **AnswerGeneratorRunner**: Orchestrates the answer generation process

## Usage

```typescript
// Import the runner
import { AnswerGeneratorRunner } from './modules/answer-generator';

// Inject the runner in your service
constructor(private readonly answerGeneratorRunner: AnswerGeneratorRunner) {}

// Generate an answer
const answer = await this.answerGeneratorRunner.run({
  queryId: 'query-123',
  query: 'What are the benefits of AI in content marketing?',
  provider: 'openai',
  maxTokens: 1000,
  temperature: 0.7,
});

// Generate multiple answers
const answers = await this.answerGeneratorRunner.runMultiple({
  queryId: 'query-123',
  query: 'What are the benefits of AI in content marketing?',
}, 3);
```

## Configuration

The module uses the following environment variables:

- `AI_PROVIDER`: Default AI provider to use (default: 'openai')
- `AI_MAX_TOKENS`: Default maximum tokens for answer generation (default: 1000)
- `AI_TEMPERATURE`: Default temperature for answer generation (default: 0.7)
- `ANSWER_MIN_LENGTH`: Minimum length for valid answers (default: 50)
- `ANSWER_MAX_LENGTH`: Maximum length for valid answers (default: 4000)
- `ANSWER_MIN_CITATIONS`: Minimum number of citations required (default: 0)
- `SCORE_WEIGHT_RELEVANCE`: Weight for relevance score (default: 0.4)
- `SCORE_WEIGHT_ACCURACY`: Weight for accuracy score (default: 0.4)
- `SCORE_WEIGHT_COMPLETENESS`: Weight for completeness score (default: 0.2)

## Integration Points

- **AI Provider Module**: Used to execute AI requests for answer generation
- **Query Module**: Provides queries for answer generation
- **Analytics Module**: Consumes answer data for analytics

## Future Enhancements

- Implement AI provider integration
- Add more sophisticated validation rules
- Improve scoring algorithms
- Add support for answer comparison and selection