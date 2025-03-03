import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnswerValidationResult,
  AnswerValidationCriteria,
} from '../interfaces/answer.interface';
import {
  ValidationRule,
  ValidationContext,
} from '../validation/validation-rule.interface';
import {
  AnswerValidation,
  ValidationStatus,
} from '../entities/answer-validation.entity';
import { Answer } from '../entities/answer.entity';
import { RelevanceValidationRule } from '../validation/rules/relevance-validation-rule';

/**
 * Answer Validator Service
 *
 * Responsible for validating generated answers against quality criteria.
 */
@Injectable()
export class AnswerValidatorService {
  private readonly logger = new Logger(AnswerValidatorService.name);
  private readonly defaultValidationCriteria: AnswerValidationCriteria;
  private readonly validationRules: ValidationRule[] = [];

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AnswerValidation)
    private readonly validationRepository: Repository<AnswerValidation>,
    private readonly relevanceRule: RelevanceValidationRule,
  ) {
    this.defaultValidationCriteria = {
      minLength: this.configService.get<number>('ANSWER_MIN_LENGTH', 50),
      maxLength: this.configService.get<number>('ANSWER_MAX_LENGTH', 4000),
      requiredElements: this.configService.get<string[]>(
        'ANSWER_REQUIRED_ELEMENTS',
        [],
      ),
      prohibitedElements: this.configService.get<string[]>(
        'ANSWER_PROHIBITED_ELEMENTS',
        [],
      ),
      minCitations: this.configService.get<number>('ANSWER_MIN_CITATIONS', 0),
    };

    // Register validation rules
    this.validationRules.push(relevanceRule);
    // Add more rules as they are implemented
  }

  /**
   * Validate an answer against quality criteria
   *
   * @param content - The answer content
   * @param query - The original query
   * @param criteria - Custom validation criteria (optional)
   * @returns Validation result
   */
  async validateAnswer(
    content: string,
    query: string,
    criteria?: Partial<AnswerValidationCriteria>,
  ): Promise<AnswerValidationResult> {
    try {
      this.logger.log(`Validating answer for query: ${query}`);

      const validationCriteria = {
        ...this.defaultValidationCriteria,
        ...criteria,
      };

      const reasons: string[] = [];

      // Check length
      if (
        validationCriteria.minLength &&
        content.length < validationCriteria.minLength
      ) {
        reasons.push(
          `Answer is too short (${content.length} chars, minimum ${validationCriteria.minLength})`,
        );
      }

      if (
        validationCriteria.maxLength &&
        content.length > validationCriteria.maxLength
      ) {
        reasons.push(
          `Answer is too long (${content.length} chars, maximum ${validationCriteria.maxLength})`,
        );
      }

      // Check required elements
      if (
        validationCriteria.requiredElements &&
        validationCriteria.requiredElements.length > 0
      ) {
        for (const element of validationCriteria.requiredElements) {
          if (!content.includes(element)) {
            reasons.push(`Answer is missing required element: ${element}`);
          }
        }
      }

      // Check prohibited elements
      if (
        validationCriteria.prohibitedElements &&
        validationCriteria.prohibitedElements.length > 0
      ) {
        for (const element of validationCriteria.prohibitedElements) {
          if (content.includes(element)) {
            reasons.push(`Answer contains prohibited element: ${element}`);
          }
        }
      }

      // Check citations (basic implementation)
      if (
        validationCriteria.minCitations &&
        validationCriteria.minCitations > 0
      ) {
        const citationCount = this.countCitations(content);
        if (citationCount < validationCriteria.minCitations) {
          reasons.push(
            `Answer has insufficient citations (${citationCount}, minimum ${validationCriteria.minCitations})`,
          );
        }
      }

      // Determine if the answer is valid
      const isValid = reasons.length === 0;

      return {
        isValid,
        reasons: reasons.length > 0 ? reasons : undefined,
      };
    } catch (error) {
      this.logger.error(
        `Error validating answer: ${error.message}`,
        error.stack,
      );
      return {
        isValid: false,
        reasons: [`Error during validation: ${error.message}`],
      };
    }
  }

  /**
   * Validate an answer using the validation rules system
   *
   * @param answer - The answer entity to validate
   * @param queryText - The original query text
   * @returns Array of validation results
   */
  async validateAnswerWithRules(
    answer: Answer,
    queryText?: string,
  ): Promise<AnswerValidation[]> {
    try {
      this.logger.log(`Validating answer ${answer.id} with rules`);

      const context: ValidationContext = {
        queryId: answer.queryId,
        queryText,
        answerContent: answer.content,
        provider: answer.provider,
        providerMetadata: answer.providerMetadata,
      };

      const validationResults = [];

      // Run all validation rules
      for (const rule of this.validationRules) {
        try {
          const result = await rule.validate(context);

          // Create validation entity
          const validation = this.validationRepository.create({
            answerId: answer.id,
            validationType: result.type,
            status: result.status,
            message: result.message,
            confidence: result.confidence,
            validationDetails: result.details,
          });

          // Save validation result
          const savedValidation =
            await this.validationRepository.save(validation);
          validationResults.push(savedValidation);
        } catch (ruleError) {
          this.logger.error(
            `Error running validation rule ${rule.getType()}: ${ruleError.message}`,
            ruleError.stack,
          );

          // Create error validation entity
          const errorValidation = this.validationRepository.create({
            answerId: answer.id,
            validationType: rule.getType(),
            status: ValidationStatus.FAILED,
            message: `Error during validation: ${ruleError.message}`,
            confidence: 1.0,
          });

          const savedValidation =
            await this.validationRepository.save(errorValidation);
          validationResults.push(savedValidation);
        }
      }

      return validationResults;
    } catch (error) {
      this.logger.error(
        `Error validating answer with rules: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Count citations in answer content (basic implementation)
   *
   * @param content - The answer content
   * @returns Number of citations found
   */
  private countCitations(content: string): number {
    // This is a basic implementation that looks for common citation patterns
    // In a real implementation, this would be more sophisticated

    // Look for patterns like [1], [2], etc.
    const bracketCitations = (content.match(/\[\d+\]/g) || []).length;

    // Look for patterns like (Author, Year)
    const authorYearCitations = (content.match(/\([A-Za-z]+,\s*\d{4}\)/g) || [])
      .length;

    // Look for footnote markers
    const footnoteCitations = (content.match(/\[\^?\d+\^?\]/g) || []).length;

    return bracketCitations + authorYearCitations + footnoteCitations;
  }
}
