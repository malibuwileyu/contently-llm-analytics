import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategoryEntity } from '../entities/business-category.entity';
import { CompetitorEntity } from '../entities/competitor.entity';
import { allQueryTemplates, QueryTemplateData } from '../data/query-templates';
import {
  BatchQueryGenerationDto,
  BatchQueryGenerationResponse,
  BatchQueryGenerationResponseItem,
} from '../dto/batch-query-generation.dto';
import { QueryValidationResponseDto } from '../dto/query-validation.dto';

/**
 * Service for generating queries based on templates
 */
@Injectable()
export class QueryGeneratorService {
  private readonly logger = new Logger(QueryGeneratorService.name);

  constructor(
    @InjectRepository(BusinessCategoryEntity)
    private readonly businessCategoryRepository: Repository<BusinessCategoryEntity>,
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
  ) {}

  /**
   * Generate a list of queries for a specific business category
   * @param categoryId The ID of the business category
   * @param limit Maximum number of queries to generate
   * @returns Array of generated queries
   */
  async generateQueriesForCategory(
    categoryId: string,
    limit = 10,
  ): Promise<string[]> {
    try {
      // Get the business category
      const category = await this.businessCategoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new Error(`Business category with ID ${categoryId} not found`);
      }

      // Get competitors for this category
      const competitors = await this.competitorRepository.find({
        where: { businessCategoryId: categoryId },
      });

      if (!competitors || competitors.length === 0) {
        this.logger.warn(`No competitors found for category ${category.name}`);
      }

      // Prepare placeholder values
      const placeholderValues = this.preparePlaceholderValues(
        category,
        competitors,
      );

      // Generate queries
      const queries = this.generateQueries(placeholderValues, limit);

      return queries;
    } catch (error) {
      this.logger.error(
        `Error generating queries: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a list of queries for a specific customer (competitor marked as customer)
   * @param customerId The ID of the customer competitor
   * @param limit Maximum number of queries to generate
   * @returns Array of generated queries
   */
  async generateQueriesForCustomer(
    customerId: string,
    limit = 10,
  ): Promise<string[]> {
    try {
      // Get the customer competitor
      const customer = await this.competitorRepository.findOne({
        where: { id: customerId, isCustomer: true },
      });

      if (!customer) {
        throw new Error(`Customer competitor with ID ${customerId} not found`);
      }

      // Get the business category
      const category = await this.businessCategoryRepository.findOne({
        where: { id: customer.businessCategoryId },
      });

      if (!category) {
        throw new Error(
          `Business category with ID ${customer.businessCategoryId} not found`,
        );
      }

      // Get other competitors in the same category
      const competitors = await this.competitorRepository.find({
        where: { businessCategoryId: category.id },
      });

      // Prepare placeholder values with customer as the primary brand
      const placeholderValues = this.preparePlaceholderValuesForCustomer(
        category,
        customer,
        competitors,
      );

      // Generate queries
      const queries = this.generateQueries(placeholderValues, limit);

      return queries;
    } catch (error) {
      this.logger.error(
        `Error generating queries for customer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate a list of comparison queries between two competitors
   * @param competitor1Id The ID of the first competitor
   * @param competitor2Id The ID of the second competitor
   * @param limit Maximum number of queries to generate
   * @returns Array of generated comparison queries
   */
  async generateComparisonQueries(
    competitor1Id: string,
    competitor2Id: string,
    limit = 10,
  ): Promise<string[]> {
    try {
      // Get the competitors
      const competitor1 = await this.competitorRepository.findOne({
        where: { id: competitor1Id },
      });

      if (!competitor1) {
        throw new Error(`Competitor with ID ${competitor1Id} not found`);
      }

      const competitor2 = await this.competitorRepository.findOne({
        where: { id: competitor2Id },
      });

      if (!competitor2) {
        throw new Error(`Competitor with ID ${competitor2Id} not found`);
      }

      // Verify they are in the same category
      if (competitor1.businessCategoryId !== competitor2.businessCategoryId) {
        throw new Error(
          'Competitors must be in the same business category for comparison',
        );
      }

      // Get the business category
      const category = await this.businessCategoryRepository.findOne({
        where: { id: competitor1.businessCategoryId },
      });

      if (!category) {
        throw new Error(
          `Business category with ID ${competitor1.businessCategoryId} not found`,
        );
      }

      // Prepare placeholder values specifically for comparison
      const placeholderValues = this.preparePlaceholderValuesForComparison(
        category,
        competitor1,
        competitor2,
      );

      // Generate comparison queries only
      const queries = this.generateComparisonQueriesOnly(
        placeholderValues,
        limit,
      );

      return queries;
    } catch (error) {
      this.logger.error(
        `Error generating comparison queries: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Prepare placeholder values for templates
   * @param category Business category
   * @param competitors List of competitors
   * @returns Object with placeholder values
   */
  private preparePlaceholderValues(
    category: BusinessCategoryEntity,
    competitors: CompetitorEntity[],
  ): Record<string, string[]> {
    const placeholderValues: Record<string, string[]> = {
      category: [category.name],
      _year: ['2023', '2024'],
      _use_case: [
        'beginners',
        'professionals',
        'everyday use',
        'special occasions',
      ],
      _user_profile: [
        'is new to the field',
        'needs professional quality',
        'has a limited budget',
        'values durability',
      ],
      _location: ['United States', 'Europe', 'online', 'local stores'],
    };

    // Add features based on category
    switch (category.name.toLowerCase()) {
      case 'athletic shoes':
        placeholderValues.feature = [
          'comfort',
          'durability',
          'support',
          'style',
          'breathability',
        ];
        break;
      case 'smartphones':
        placeholderValues.feature = [
          'camera',
          'battery life',
          'performance',
          'display',
          'storage',
        ];
        break;
      case 'laptops':
        placeholderValues.feature = [
          'performance',
          'battery life',
          'display',
          'portability',
          'cooling',
        ];
        break;
      default:
        placeholderValues.feature = [
          'quality',
          'durability',
          'design',
          'performance',
          'value',
        ];
    }

    // Add competitors as brands
    if (competitors && competitors.length > 0) {
      placeholderValues.brand = competitors.map(comp => comp.name);

      // For comparison templates, we need at least brand1 and brand2
      if (competitors.length >= 2) {
        placeholderValues.brand1 = [competitors[0].name];
        placeholderValues.brand2 = [competitors[1].name];
      }
    } else {
      // Default brands if no competitors found
      placeholderValues.brand = ['Brand A', 'Brand B', 'Brand C'];
      placeholderValues.brand1 = ['Brand A'];
      placeholderValues.brand2 = ['Brand B'];
    }

    return placeholderValues;
  }

  /**
   * Prepare placeholder values for templates with customer as the primary brand
   * @param category Business category
   * @param customer Customer competitor
   * @param competitors List of all competitors
   * @returns Object with placeholder values
   */
  private preparePlaceholderValuesForCustomer(
    category: BusinessCategoryEntity,
    customer: CompetitorEntity,
    competitors: CompetitorEntity[],
  ): Record<string, string[]> {
    // Start with standard placeholder values
    const placeholderValues = this.preparePlaceholderValues(
      category,
      competitors,
    );

    // Ensure the customer is the primary brand
    placeholderValues.brand1 = [customer.name];

    // Find a competitor that is not the customer for brand2
    const otherCompetitors = competitors.filter(
      comp => comp.id !== customer.id,
    );
    if (otherCompetitors.length > 0) {
      placeholderValues.brand2 = [otherCompetitors[0].name];
    }

    return placeholderValues;
  }

  /**
   * Prepare placeholder values specifically for comparison queries
   * @param category Business category
   * @param competitor1 First competitor
   * @param competitor2 Second competitor
   * @returns Object with placeholder values
   */
  private preparePlaceholderValuesForComparison(
    category: BusinessCategoryEntity,
    competitor1: CompetitorEntity,
    competitor2: CompetitorEntity,
  ): Record<string, string[]> {
    // Start with standard placeholder values
    const placeholderValues = this.preparePlaceholderValues(category, [
      competitor1,
      competitor2,
    ]);

    // Set the specific competitors for comparison
    placeholderValues.brand1 = [competitor1.name];
    placeholderValues.brand2 = [competitor2.name];

    return placeholderValues;
  }

  /**
   * Generate queries by filling templates with placeholder values
   * @param placeholderValues Values to replace placeholders
   * @param limit Maximum number of queries to generate
   * @returns Array of generated queries
   */
  private generateQueries(
    placeholderValues: Record<string, string[]>,
    limit: number,
  ): string[] {
    const generatedQueries: string[] = [];

    // Sort templates by priority (higher first)
    const sortedTemplates = [...allQueryTemplates].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    // Try to generate queries from each template
    for (const template of sortedTemplates) {
      if (generatedQueries.length >= limit) {
        break;
      }

      // Check if we have all required placeholders
      const canUseTemplate = this.canUseTemplate(template, placeholderValues);

      if (canUseTemplate) {
        const query = this.fillTemplate(template, placeholderValues);
        if (query && !generatedQueries.includes(query)) {
          generatedQueries.push(query);
        }
      }
    }

    // If we still need more queries, try to generate variations
    if (generatedQueries.length < limit) {
      // Generate variations by using different placeholder values
      for (const template of sortedTemplates) {
        if (generatedQueries.length >= limit) {
          break;
        }

        if (this.canUseTemplate(template, placeholderValues)) {
          const variations = this.generateVariations(
            template,
            placeholderValues,
            3,
          );

          for (const variation of variations) {
            if (generatedQueries.length >= limit) {
              break;
            }

            if (!generatedQueries.includes(variation)) {
              generatedQueries.push(variation);
            }
          }
        }
      }
    }

    return generatedQueries;
  }

  /**
   * Generate comparison queries only
   * @param placeholderValues Values to replace placeholders
   * @param limit Maximum number of queries to generate
   * @returns Array of generated comparison queries
   */
  private generateComparisonQueriesOnly(
    placeholderValues: Record<string, string[]>,
    limit: number,
  ): string[] {
    const generatedQueries: string[] = [];

    // Filter for comparison templates only
    const comparisonTemplates = allQueryTemplates.filter(
      template => template.type === 'comparison',
    );

    // Sort templates by priority (higher first)
    const sortedTemplates = [...comparisonTemplates].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );

    // Try to generate queries from each template
    for (const template of sortedTemplates) {
      if (generatedQueries.length >= limit) {
        break;
      }

      // Check if we have all required placeholders
      const canUseTemplate = this.canUseTemplate(template, placeholderValues);

      if (canUseTemplate) {
        const query = this.fillTemplate(template, placeholderValues);
        if (query && !generatedQueries.includes(query)) {
          generatedQueries.push(query);
        }
      }
    }

    // If we still need more queries, try to generate variations
    if (generatedQueries.length < limit) {
      // Generate variations by using different placeholder values
      for (const template of sortedTemplates) {
        if (generatedQueries.length >= limit) {
          break;
        }

        if (this.canUseTemplate(template, placeholderValues)) {
          const variations = this.generateVariations(
            template,
            placeholderValues,
            3,
          );

          for (const variation of variations) {
            if (generatedQueries.length >= limit) {
              break;
            }

            if (!generatedQueries.includes(variation)) {
              generatedQueries.push(variation);
            }
          }
        }
      }
    }

    return generatedQueries;
  }

  /**
   * Check if a template can be used with the available placeholder values
   * @param template Query template
   * @param placeholderValues Available placeholder values
   * @returns Boolean indicating if template can be used
   */
  private canUseTemplate(
    template: QueryTemplateData,
    placeholderValues: Record<string, string[]>,
  ): boolean {
    if (!template.requiredPlaceholders) {
      return true;
    }

    return template.requiredPlaceholders.every(
      placeholder =>
        placeholderValues[placeholder] &&
        placeholderValues[placeholder].length > 0,
    );
  }

  /**
   * Fill a template with placeholder values
   * @param template Query template
   * @param placeholderValues Values to replace placeholders
   * @returns Generated query
   */
  private fillTemplate(
    template: QueryTemplateData,
    placeholderValues: Record<string, string[]>,
  ): string {
    let query = template.template;

    // Find all placeholders in the template
    const placeholderRegex = /{([^}]+)}/g;
    const placeholders = [...template.template.matchAll(placeholderRegex)].map(
      match => match[1],
    );

    // Replace each placeholder with a value
    for (const placeholder of placeholders) {
      if (
        placeholderValues[placeholder] &&
        placeholderValues[placeholder].length > 0
      ) {
        // Use the first value by default
        const value = placeholderValues[placeholder][0];
        query = query.replace(`{${placeholder}}`, value);
      }
    }

    return query;
  }

  /**
   * Generate variations of a query by using different placeholder values
   * @param template Query template
   * @param placeholderValues Values to replace placeholders
   * @param maxVariations Maximum number of variations to generate
   * @returns Array of query variations
   */
  private generateVariations(
    template: QueryTemplateData,
    placeholderValues: Record<string, string[]>,
    maxVariations: number,
  ): string[] {
    const variations: string[] = [];

    // Find all placeholders in the template
    const placeholderRegex = /{([^}]+)}/g;
    const placeholders = [...template.template.matchAll(placeholderRegex)].map(
      match => match[1],
    );

    // Find placeholders with multiple values
    const placeholdersWithMultipleValues = placeholders.filter(
      p => placeholderValues[p] && placeholderValues[p].length > 1,
    );

    if (placeholdersWithMultipleValues.length === 0) {
      // No placeholders with multiple values, just return the basic filled template
      const query = this.fillTemplate(template, placeholderValues);
      if (query) {
        variations.push(query);
      }
      return variations;
    }

    // Choose one placeholder to vary
    const placeholderToVary = placeholdersWithMultipleValues[0];
    const values = placeholderValues[placeholderToVary];

    // Generate variations by using different values for the chosen placeholder
    for (let i = 0; i < Math.min(values.length, maxVariations); i++) {
      const modifiedValues = { ...placeholderValues };
      modifiedValues[placeholderToVary] = [values[i]];

      const query = this.fillTemplate(template, modifiedValues);
      if (query) {
        variations.push(query);
      }
    }

    return variations;
  }

  /**
   * Generates queries in batch for multiple categories, customers, and comparisons
   * @param batchDto The batch query generation request
   * @returns A response containing all generated queries or errors
   */
  async generateQueriesBatch(
    batchDto: BatchQueryGenerationDto,
  ): Promise<BatchQueryGenerationResponse> {
    const results: BatchQueryGenerationResponseItem[] = [];

    // Process category requests
    if (batchDto.categories && batchDto.categories.length > 0) {
      for (const categoryRequest of batchDto.categories) {
        try {
          const queries = await this.generateQueriesForCategory(
            categoryRequest._categoryId,
            categoryRequest.limit,
          );

          results.push({
            type: 'category',
            _ids: [categoryRequest._categoryId],
            queries,
          });
        } catch (error) {
          results.push({
            type: 'category',
            _ids: [categoryRequest._categoryId],
            queries: [],
            error: error.message,
          });
        }
      }
    }

    // Process customer requests
    if (batchDto.customers && batchDto.customers.length > 0) {
      for (const customerRequest of batchDto.customers) {
        try {
          const queries = await this.generateQueriesForCustomer(
            customerRequest._customerId,
            customerRequest.limit,
          );

          results.push({
            type: 'customer',
            _ids: [customerRequest._customerId],
            queries,
          });
        } catch (error) {
          results.push({
            type: 'customer',
            _ids: [customerRequest._customerId],
            queries: [],
            error: error.message,
          });
        }
      }
    }

    // Process comparison requests
    if (batchDto.comparisons && batchDto.comparisons.length > 0) {
      for (const comparisonRequest of batchDto.comparisons) {
        try {
          const queries = await this.generateComparisonQueries(
            comparisonRequest._competitor1Id,
            comparisonRequest._competitor2Id,
            comparisonRequest.limit,
          );

          results.push({
            type: 'comparison',
            _ids: [
              comparisonRequest._competitor1Id,
              comparisonRequest._competitor2Id,
            ],
            queries,
          });
        } catch (error) {
          results.push({
            type: 'comparison',
            _ids: [
              comparisonRequest._competitor1Id,
              comparisonRequest._competitor2Id,
            ],
            queries: [],
            error: error.message,
          });
        }
      }
    }

    return { results };
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

    // If score is below _threshold, mark as invalid
    if (response.score < 0.5) {
      response.isValid = false;
    }

    return response;
  }
}
