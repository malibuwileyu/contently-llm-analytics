import {
  ValidationResultType,
  ValidationStatus,
} from '../entities/answer-validation.entity';

/**
 * Interface for validation result
 */
export interface ValidationResult {
  type: ValidationResultType;
  status: ValidationStatus;
  message?: string;
  confidence: number;
  details?: Record<string, any>;
}

/**
 * Interface for validation context
 */
export interface ValidationContext {
  queryId: string;
  queryText?: string;
  answerContent: string;
  provider: string;
  providerMetadata?: Record<string, any>;
  additionalContext?: Record<string, any>;
}

/**
 * Interface for validation rule
 */
export interface ValidationRule {
  /**
   * Get the type of validation rule
   */
  getType(): ValidationResultType;

  /**
   * Validate the answer against the rule
   * @param context The validation context
   * @returns The validation result
   */
  validate(context: ValidationContext): Promise<ValidationResult>;
}
