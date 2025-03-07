import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProviderService } from '../../../modules/ai-provider/services/openai-provider.service';

export interface QueryValidationResponseDto {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

@Injectable()
export class QueryGeneratorService {
  private readonly logger = new Logger(QueryGeneratorService.name);

  constructor(private readonly openAIProvider: OpenAIProviderService) {}

  async generateQueries(searchTerm: string, description?: string): Promise<string[]> {
    const prompt = `
      Given the keyword below, first determine its broader category or industry. Then, generate a list of search queries that are likely to return results mentioning the keyword—without explicitly including the keyword itself.

      The queries should reflect common ways users research entities in this category, focusing on discovery and informational queries with five or more words.

      Avoid queries that are too general (e.g., "How does [industry process] work?") or too specific to unrelated functions (e.g., "How do I reset my online banking password?").

      Return the response strictly as a JSON array with no extra text or explanations.

      Keyword: ${searchTerm}${description ? ` (Description: ${description})` : ''}
    `;

    try {
      const response = await this.openAIProvider.complete(prompt);
      const queries = JSON.parse(response.content.trim());

      if (!Array.isArray(queries)) {
        throw new Error('Response is not a JSON array');
      }

      return queries;
    } catch (error) {
      this.logger.error(`Error generating queries: ${error.message}`);
      throw new Error(`Failed to generate queries: ${error.message}`);
    }
  }

  async generateQueriesBatch(
    searchTerms: string[],
    descriptions?: Record<string, string>,
  ): Promise<Record<string, string[]>> {
    const results: Record<string, string[]> = {};

    for (const term of searchTerms) {
      try {
        results[term] = await this.generateQueries(
          term,
          descriptions?.[term]
        );
      } catch (error) {
        this.logger.error(
          `Error generating queries for term ${term}: ${error.message}`,
        );
        results[term] = [];
      }
    }

    return results;
  }

  /**
   * Validates a search query and provides feedback
   * @param query The search query to validate
   * @returns Validation results including score and suggestions
   */
  async validateQuery(query: string): Promise<QueryValidationResponseDto> {
    this.logger.log(`Validating query: ${query}`);

    // Initialize response with non-nullable arrays
    const response: QueryValidationResponseDto = {
      isValid: true,
      score: 1.0,
      issues: [],
      suggestions: [],
    };

    // Check for minimum length
    if (query.length < 10) {
      response.isValid = false;
      response.score -= 0.3;
      response.issues!.push('Query is too short');
      response.suggestions!.push('Make your query more specific and detailed');
    }

    // Check for maximum length
    if (query.length > 150) {
      response.isValid = false;
      response.score -= 0.2;
      response.issues!.push('Query is too long');
      response.suggestions!.push('Simplify your query to be more concise');
    }

    // Check for question format
    if (
      !query.includes('?') &&
      !query.toLowerCase().startsWith('how') &&
      !query.toLowerCase().startsWith('what') &&
      !query.toLowerCase().startsWith('which') &&
      !query.toLowerCase().startsWith('where') &&
      !query.toLowerCase().startsWith('when') &&
      !query.toLowerCase().startsWith('why') &&
      !query.toLowerCase().startsWith('who')
    ) {
      response.score -= 0.1;
      response.suggestions!.push(
        'Format your query as a question for better results',
      );
    }

    // Check for specificity
    const specificTerms = [
      'brand',
      'product',
      'feature',
      'price',
      'compare',
      'vs',
      'versus',
      'best',
      'top',
      'recommended',
    ];
    const hasSpecificTerms = specificTerms.some(term =>
      query.toLowerCase().includes(term),
    );

    if (!hasSpecificTerms) {
      response.score -= 0.2;
      response.issues!.push('Query lacks specificity');
      response.suggestions!.push(
        'Include specific brands, products, or features in your query',
      );
    }

    // Check for common stop words only
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'is',
      'are',
      'was',
      'were',
    ];
    const words = query.toLowerCase().split(' ');

    if (words.length <= 3 || words.every(word => stopWords.includes(word))) {
      response.isValid = false;
      response.score -= 0.4;
      response.issues!.push('Query contains only common words');
      response.suggestions!.push(
        'Add specific terms related to your search intent',
      );
    }

    // Ensure score is between 0 and 1
    response.score = Math.max(0, Math.min(1, response.score));

    // If score is below threshold, mark as invalid
    if (response.score < 0.5) {
      response.isValid = false;
    }

    return response;
  }
} 