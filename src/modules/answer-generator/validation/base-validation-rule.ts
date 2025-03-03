import {
  ValidationResultType,
  ValidationStatus,
} from '../entities/answer-validation.entity';
import {
  ValidationContext,
  ValidationResult,
  ValidationRule,
} from './validation-rule.interface';

/**
 * Abstract base class for validation rules
 */
export abstract class BaseValidationRule implements ValidationRule {
  protected readonly type: ValidationResultType;

  /**
   * Constructor
   * @param type The validation rule type
   */
  constructor(type: ValidationResultType) {
    this.type = type;
  }

  /**
   * Get the type of validation rule
   */
  getType(): ValidationResultType {
    return this.type;
  }

  /**
   * Validate the answer against the rule
   * @param context The validation context
   * @returns The validation result
   */
  abstract validate(context: ValidationContext): Promise<ValidationResult>;

  /**
   * Create a successful validation result
   * @param message Optional success message
   * @param confidence Confidence level (0-1)
   * @param details Additional details
   * @returns The validation result
   */
  protected createSuccessResult(
    message?: string,
    confidence = 1.0,
    details?: Record<string, any>,
  ): ValidationResult {
    return {
      type: this.type,
      status: ValidationStatus.PASSED,
      message,
      confidence,
      details,
    };
  }

  /**
   * Create a failed validation result
   * @param message Failure message
   * @param confidence Confidence level (0-1)
   * @param details Additional details
   * @returns The validation result
   */
  protected createFailureResult(
    message: string,
    confidence = 1.0,
    details?: Record<string, any>,
  ): ValidationResult {
    return {
      type: this.type,
      status: ValidationStatus.FAILED,
      message,
      confidence,
      details,
    };
  }

  /**
   * Create a warning validation result
   * @param message Warning message
   * @param confidence Confidence level (0-1)
   * @param details Additional details
   * @returns The validation result
   */
  protected createWarningResult(
    message: string,
    confidence = 1.0,
    details?: Record<string, any>,
  ): ValidationResult {
    return {
      type: this.type,
      status: ValidationStatus.WARNING,
      message,
      confidence,
      details,
    };
  }
}
