import { Injectable } from '@nestjs/common';
import { QueryTemplate } from '../types/query.types';
import { QueryValidationResult, ResponseValidationResult } from '../types/query.types';

@Injectable()
export class QueryValidationService {
  validateQuery(query: string, template: QueryTemplate): QueryValidationResult {
    const errors: string[] = [];

    // Extract solution type from query
    const solutionTypePattern = /\b(?:platform|software|tool|service|solution|system)\b/i;
    const hasSolutionType = solutionTypePattern.test(query);

    // Check validation rules
    for (const rule of template.validationRules) {
      switch (rule.type) {
        case 'required_variable':
          if (rule.value === 'solution_type') {
            if (!hasSolutionType) {
              errors.push(rule.message);
            }
          } else if (!query.includes(`{${rule.value}}`)) {
            errors.push(rule.message);
          }
          break;
        case 'forbidden_phrase':
          if (query.toLowerCase().includes(rule.value.toString().toLowerCase())) {
            errors.push(rule.message);
          }
          break;
        case 'min_length':
          if (query.split(/\s+/).length < (rule.value as number)) {
            errors.push(rule.message);
          }
          break;
        case 'max_length':
          if (query.split(/\s+/).length > (rule.value as number)) {
            errors.push(rule.message);
          }
          break;
        case 'pattern':
          if (!(rule.value as RegExp).test(query)) {
            errors.push(rule.message);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateResponse(response: string, template: QueryTemplate): ResponseValidationResult {
    const errors: string[] = [];
    let qualityScore = 100;

    // Check required elements
    for (const element of template.responseValidation.requiredElements) {
      switch (element.type) {
        case 'fact':
          if (!this.containsFactualStatement(response)) {
            errors.push(`Missing required element: ${element.description}`);
            qualityScore -= 20;
          }
          break;
        case 'comparison':
          if (!this.containsComparison(response)) {
            errors.push(`Missing required element: ${element.description}`);
            qualityScore -= 20;
          }
          break;
        case 'metric':
          if (!this.containsMetric(response)) {
            errors.push(`Missing required element: ${element.description}`);
            qualityScore -= 15;
          }
          break;
        case 'example':
          if (!this.containsExample(response)) {
            errors.push(`Missing required element: ${element.description}`);
            qualityScore -= 15;
          }
          break;
        case 'reference':
          if (!this.containsReference(response)) {
            errors.push(`Missing required element: ${element.description}`);
            qualityScore -= 15;
          }
          break;
      }
    }

    // Check forbidden elements
    for (const element of template.responseValidation.forbiddenElements) {
      if (element.pattern.test(response)) {
        errors.push(element.message);
        qualityScore -= 25;
      }
    }

    // Run quality checks
    const qualityMetrics = {
      specificity: 0,
      objectivity: 0,
      relevance: 0
    };

    for (const check of template.responseValidation.qualityChecks) {
      const passed = check.validator(response);
      if (!passed) {
        errors.push(check.message);
        qualityScore -= 15;
      }

      switch (check.type) {
        case 'specificity':
          qualityMetrics.specificity = passed ? 100 : 0;
          break;
        case 'objectivity':
          qualityMetrics.objectivity = passed ? 100 : 0;
          break;
        case 'relevance':
          qualityMetrics.relevance = passed ? 100 : 0;
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      qualityScore: Math.max(0, qualityScore),
      metrics: qualityMetrics
    };
  }

  private containsFactualStatement(response: string): boolean {
    // Check for specific company names, numbers, dates, or other factual indicators
    const factualPatterns = [
      /\b[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*)*\b/, // Company names
      /\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/, // Numbers and percentages
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/, // Dates
      /\b(?:launched|released|introduced|established|founded)\b/ // Factual verbs
    ];

    return factualPatterns.some(pattern => pattern.test(response));
  }

  private containsComparison(response: string): boolean {
    const comparisonPatterns = [
      /\b(?:compared to|versus|vs\.|while|whereas|unlike|similar to|more than|less than)\b/i,
      /\b(?:better|worse|higher|lower|larger|smaller|faster|slower)\b/i,
      /\b(?:leads|dominates|excels|outperforms)\b/i
    ];

    return comparisonPatterns.some(pattern => pattern.test(response));
  }

  private containsMetric(response: string): boolean {
    const metricPatterns = [
      /\b\d+(?:,\d{3})*(?:\.\d+)?%?\b/, // Numbers and percentages
      /\b(?:market share|revenue|growth|users|customers|adoption rate)\b/i,
      /\b(?:increased|decreased|grew|reduced|expanded)\b/i
    ];

    return metricPatterns.some(pattern => pattern.test(response));
  }

  private containsExample(response: string): boolean {
    const examplePatterns = [
      /\b(?:for example|such as|like|including|specifically)\b/i,
      /\b(?:demonstrates|shows|illustrates)\b/i,
      /"[^"]*"/ // Quoted text
    ];

    return examplePatterns.some(pattern => pattern.test(response));
  }

  private containsReference(response: string): boolean {
    const referencePatterns = [
      /\b(?:according to|based on|reported by|cited by)\b/i,
      /\b(?:research|study|survey|report|analysis)\b/i,
      /\b(?:in \d{4}|last year|recently)\b/i
    ];

    return referencePatterns.some(pattern => pattern.test(response));
  }
} 