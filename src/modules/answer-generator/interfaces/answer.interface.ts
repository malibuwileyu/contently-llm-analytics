/**
 * Answer Interface
 *
 * Defines the structure for answer data returned from AI providers.
 */
export interface Answer {
  content: string;
  provider: string;
  providerMetadata?: Record<string, any>;
}

/**
 * Answer with Scores Interface
 *
 * Extends the basic Answer interface with scoring metrics.
 */
export interface AnswerWithScores extends Answer {
  relevanceScore: number;
  accuracyScore: number;
  completenessScore: number;
  overallScore: number;
}

/**
 * Create Answer DTO
 *
 * Data transfer object for creating a new answer.
 */
export interface CreateAnswerDto {
  queryId: string;
  content: string;
  provider: string;
  providerMetadata?: Record<string, any>;
}

/**
 * Answer Validation Result
 *
 * Result of validating an answer against quality criteria.
 */
export interface AnswerValidationResult {
  isValid: boolean;
  reasons?: string[];
  scores?: {
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  };
}

/**
 * Answer Validation Criteria
 *
 * Criteria used to validate the quality of generated answers.
 */
export interface AnswerValidationCriteria {
  minLength?: number;
  maxLength?: number;
  requiredElements?: string[];
  prohibitedElements?: string[];
  minCitations?: number;
}

/**
 * Answer Generation Options
 *
 * Options for generating an answer from an AI provider.
 */
export interface AnswerGenerationOptions {
  provider?: string;
  maxTokens?: number;
  temperature?: number;
  includeMetadata?: boolean;
  validateAnswer?: boolean;
}
