import { Injectable } from '@nestjs/common';
import { ValidationResultType } from '../../entities/answer-validation.entity';
import { BaseValidationRule } from '../base-validation-rule';
import {
  ValidationContext,
  ValidationResult,
} from '../validation-rule.interface';

/**
 * Validation rule for checking the relevance of an answer to the query
 */
@Injectable()
export class RelevanceValidationRule extends BaseValidationRule {
  constructor() {
    super(ValidationResultType.RELEVANCE);
  }

  /**
   * Validate the relevance of an answer to the query
   * @param context The validation context
   * @returns The validation result
   */
  async validate(context: ValidationContext): Promise<ValidationResult> {
    const { queryText, answerContent } = context;

    // If query text is not provided, we can't validate relevance
    if (!queryText) {
      return this.createWarningResult(
        'Cannot validate relevance without query text',
        0.5,
      );
    }

    // Simple implementation - check if answer contains key terms from query
    // In a real implementation, this would use more sophisticated NLP techniques
    const queryTerms = this.extractKeyTerms(queryText);
    const answerTerms = this.extractKeyTerms(answerContent);

    const commonTerms = queryTerms.filter(term => answerTerms.includes(term));
    const relevanceScore = commonTerms.length / queryTerms.length;

    if (relevanceScore < 0.3) {
      return this.createFailureResult(
        'Answer appears to be irrelevant to the query',
        0.7,
        { relevanceScore, queryTerms, commonTerms },
      );
    }

    if (relevanceScore < 0.6) {
      return this.createWarningResult(
        'Answer may not be fully relevant to the query',
        0.6,
        { relevanceScore, queryTerms, commonTerms },
      );
    }

    return this.createSuccessResult('Answer is relevant to the query', 0.8, {
      relevanceScore,
      queryTerms,
      commonTerms,
    });
  }

  /**
   * Extract key terms from text
   * @param text The text to extract terms from
   * @returns Array of key terms
   */
  private extractKeyTerms(text: string): string[] {
    // Simple implementation - split by spaces and filter out common words
    // In a real implementation, this would use more sophisticated NLP techniques
    const commonWords = new Set([
      'a',
      'an',
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'with',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'shall',
      'should',
      'can',
      'could',
      'may',
      'might',
      'must',
      'of',
      'by',
      'as',
      'if',
      'then',
      'else',
      'when',
      'where',
      'why',
      'how',
      'all',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 2 && !commonWords.has(word)); // Filter out common words and short words
  }
}
