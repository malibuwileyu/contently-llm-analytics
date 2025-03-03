/**
 * Answer Metadata Interface
 *
 * Defines the structure for metadata associated with generated answers.
 */
export interface AnswerMetadata {
  key: string;
  valueType: 'text' | 'numeric' | 'json';
  textValue?: string;
  numericValue?: number;
  jsonValue?: Record<string, any>;
}

/**
 * Create Answer Metadata DTO
 *
 * Data transfer object for creating new answer metadata.
 */
export interface CreateAnswerMetadataDto {
  answerId: string;
  key: string;
  valueType: 'text' | 'numeric' | 'json';
  textValue?: string;
  numericValue?: number;
  jsonValue?: Record<string, any>;
}

/**
 * Answer Citation
 *
 * Represents a citation or source referenced in an answer.
 */
export interface AnswerCitation {
  source: string;
  text?: string;
  url?: string;
  authority?: number;
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
