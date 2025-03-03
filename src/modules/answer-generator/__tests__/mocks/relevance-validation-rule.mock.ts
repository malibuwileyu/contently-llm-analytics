import {
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';
import {
  ValidationContext,
  ValidationResult,
  ValidationRule,
} from '../../validation/validation-rule.interface';

/**
 * Mock implementation of RelevanceValidationRule for testing
 */
export class MockRelevanceValidationRule implements ValidationRule {
  private readonly type = ValidationResultType.RELEVANCE;

  /**
   * Get the type of validation rule
   */
  getType(): ValidationResultType {
    return this.type;
  }

  /**
   * Mock validate method that always returns a successful result
   * @param context The validation context
   * @returns A successful validation result
   */
  async validate(context: ValidationContext): Promise<ValidationResult> {
    return {
      type: this.type,
      status: ValidationStatus.PASSED,
      message: 'Answer is relevant to the query (mock)',
      confidence: 0.9,
      details: { mocked: true },
    };
  }
}
