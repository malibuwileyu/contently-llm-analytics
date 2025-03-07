import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { CompanyProfileEntity } from '../entities/company-profile.entity';
import { QueryTemplateEntity } from '../entities/query-template.entity';
import { PerplexityService } from './perplexity.service';
import { VariableBankService } from './variable-bank.service';
import { QueryConfig, QueryType } from '../types/query.types';

@Injectable()
export class ContextQueryService {
  constructor(
    @InjectRepository(CompanyProfileEntity)
    private readonly companyProfileRepository: Repository<CompanyProfileEntity>,
    @InjectRepository(QueryTemplateEntity)
    private readonly queryTemplateRepository: Repository<QueryTemplateEntity>,
    private readonly perplexityService: PerplexityService,
    private readonly variableBankService: VariableBankService,
  ) {}

  async generateQueriesForCompany(
    company: CompetitorEntity,
    config: QueryConfig,
  ): Promise<Record<string, string[]>> {
    // Update variable bank with company-specific data
    await this.variableBankService.updateVariableBank(company);

    // Generate queries for each type
    const industryQueries = await this.generateIndustryQueries(
      config.industryQueriesCount,
    );
    const contextQueries = await this.generateContextQueries(
      company,
      config.contextQueriesCount,
    );
    const competitiveQueries = await this.generateCompetitiveQueries(
      company,
      config.competitiveQueriesCount,
    );

    return {
      industry: industryQueries,
      context: contextQueries,
      competitive: competitiveQueries,
    };
  }

  private async generateIndustryQueries(count: number): Promise<string[]> {
    const queries: string[] = [];
    const templates = await this.queryTemplateRepository.find({
      where: { type: QueryType.INDUSTRY, isActive: true },
      order: { priority: 'DESC' },
    });

    while (queries.length < count && templates.length > 0) {
      // Get random template weighted by priority
      const template = this.getWeightedRandomTemplate(templates);

      // Generate variables for template
      const variables = await this.generateVariablesForTemplate(template);

      // Replace variables in template
      const query = this.variableBankService.replaceVariablesInTemplate(
        template.template,
        variables,
      );

      // Add query if not duplicate
      if (!queries.includes(query)) {
        queries.push(query);
      }
    }

    return queries;
  }

  private async generateContextQueries(
    company: CompetitorEntity,
    count: number,
  ): Promise<string[]> {
    const queries: string[] = [];
    const templates = await this.queryTemplateRepository.find({
      where: { type: QueryType.CONTEXT, isActive: true },
      order: { priority: 'DESC' },
    });

    while (queries.length < count && templates.length > 0) {
      const template = this.getWeightedRandomTemplate(templates);
      const variables = await this.generateVariablesForTemplate(template);

      // Add company-specific variables
      variables['company_name'] = company.name;
      variables['product/service'] = company.products?.[0] || 'platform';

      const query = this.variableBankService.replaceVariablesInTemplate(
        template.template,
        variables,
      );

      if (!queries.includes(query)) {
        queries.push(query);
      }
    }

    return queries;
  }

  private async generateCompetitiveQueries(
    company: CompetitorEntity,
    count: number,
  ): Promise<string[]> {
    const queries: string[] = [];
    const templates = await this.queryTemplateRepository.find({
      where: { type: QueryType.COMPETITIVE, isActive: true },
      order: { priority: 'DESC' },
    });

    while (queries.length < count && templates.length > 0) {
      const template = this.getWeightedRandomTemplate(templates);
      const variables = await this.generateVariablesForTemplate(template);

      // Add company-specific variables
      variables['company_name'] = company.name;
      variables['product/service'] = company.products?.[0] || 'platform';

      const query = this.variableBankService.replaceVariablesInTemplate(
        template.template,
        variables,
      );

      if (!queries.includes(query)) {
        queries.push(query);
      }
    }

    return queries;
  }

  private getWeightedRandomTemplate(
    templates: QueryTemplateEntity[],
  ): QueryTemplateEntity {
    const totalWeight = templates.reduce((sum, t) => sum + t.priority, 0);
    let random = Math.random() * totalWeight;

    for (const template of templates) {
      random -= template.priority;
      if (random <= 0) {
        return template;
      }
    }

    return templates[0];
  }

  private async generateVariablesForTemplate(
    template: QueryTemplateEntity,
  ): Promise<Record<string, string>> {
    const variables: Record<string, string> = {};

    for (const variable of template.variables) {
      if (variable !== 'company_name' && variable !== 'product/service') {
        variables[variable] =
          await this.variableBankService.getVariableValue(variable);
      }
    }

    return variables;
  }

  async validateContextRelevance(
    query: string,
    profile: CompanyProfileEntity,
  ): Promise<number> {
    // Use GPT-4 to score the relevance of the query to the company context
    const prompt = `
      Rate the relevance of this query to the company profile (0-100):
      Query: "${query}"

      Company Profile:
      - Core Offering: ${profile.core_offering}
      - Key Technologies: ${profile.key_technologies.join(', ')}
      - Target Segments: ${profile.target_segments.join(', ')}
      - Value Propositions: ${profile.value_propositions.join(', ')}

      Consider:
      1. How well the query aligns with the company's offerings
      2. Relevance to target segments
      3. Technology alignment
      4. Business value alignment

      Return only a number between 0 and 100.
    `;

    const completion = await this.perplexityService[
      'openai'
    ].chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a relevance scoring expert. Score how relevant a query is to a company profile.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 10,
    });

    const score = parseInt(completion.choices[0].message.content.trim(), 10);
    return isNaN(score) ? 0 : Math.min(100, Math.max(0, score));
  }
}
