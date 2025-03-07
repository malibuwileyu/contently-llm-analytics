import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryTemplateEntity } from '../../modules/brand-analytics/entities/query-template.entity';
import { QueryType } from '../types/query.types';
import { QueryValidationService } from './query-validation.service';
import { VariableBankService } from './variable-bank.service';

@Injectable()
export class QueryTemplateService {
  constructor(
    @InjectRepository(QueryTemplateEntity)
    private readonly queryTemplateRepository: Repository<QueryTemplateEntity>,
    private readonly queryValidationService: QueryValidationService,
    private readonly variableBankService: VariableBankService,
  ) {}

  async seedQueryTemplates(templates: QueryTemplate[]): Promise<void> {
    for (const template of templates) {
      // Check if template already exists
      const existingTemplate = await this.queryTemplateRepository.findOne({
        where: {
          type: template.type,
          intent: template.intent,
          template: template.template,
        },
      });

      if (!existingTemplate) {
        await this.queryTemplateRepository.save({
          ...template,
          isActive: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
  }

  async generateQueryVariations(
    template: QueryTemplate,
    count: number,
  ): Promise<string[]> {
    const variations: string[] = [];
    const maxAttempts = count * 3; // Allow for some failed attempts
    let attempts = 0;

    while (variations.length < count && attempts < maxAttempts) {
      attempts++;
      const variation = await this.generateVariation(template);

      // Validate the variation
      const validationResult = this.queryValidationService.validateQuery(
        variation,
        template,
      );

      if (validationResult.isValid) {
        // Check for duplicates
        if (!variations.includes(variation)) {
          variations.push(variation);
        }
      }
    }

    return variations;
  }

  private async generateVariation(template: QueryTemplate): Promise<string> {
    let variation = template.template;

    // Replace each variable with a value from the variable bank
    for (const variable of template.variables) {
      const value = await this.variableBankService.getVariableValue(variable);
      variation = variation.replace(`{${variable}}`, value);
    }

    return variation;
  }

  async getTemplatesByType(type: QueryType): Promise<QueryTemplate[]> {
    return this.queryTemplateRepository.find({
      where: {
        type,
        isActive: true,
      },
      order: {
        priority: 'DESC',
      },
    });
  }

  async validateQueryResponse(
    query: string,
    response: string,
    template: QueryTemplate,
  ): Promise<boolean> {
    // First validate the query
    const queryValidation = this.queryValidationService.validateQuery(
      query,
      template,
    );

    if (!queryValidation.isValid) {
      return false;
    }

    // Then validate the response
    const responseValidation = this.queryValidationService.validateResponse(
      response,
      template,
    );

    // Consider the response valid if it meets minimum quality standards
    return (
      responseValidation.isValid &&
      responseValidation.qualityScore >= 70 && // Minimum quality threshold
      responseValidation.metrics.specificity >= 50 &&
      responseValidation.metrics.objectivity >= 50 &&
      responseValidation.metrics.relevance >= 50
    );
  }

  async updateTemplatePriority(
    template: QueryTemplate,
    successRate: number,
  ): Promise<void> {
    // Adjust template priority based on success rate
    const priority = Math.max(1, Math.min(5, Math.ceil(successRate * 5)));

    await this.queryTemplateRepository.update(
      {
        type: template.type,
        intent: template.intent,
        template: template.template,
      },
      {
        priority,
        updatedAt: new Date(),
      },
    );
  }
}
