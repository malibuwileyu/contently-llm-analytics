import { Injectable } from '@nestjs/common';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';

export interface VariableBank {
  solution_type: string[];
  general_need: string[];
  approach: string[];
  benefit: string[];
  technology: string[];
  industry: string[];
  use_case: string[];
  technology_area: string[];
  solution_category: string[];
  target_segment: string[];
  specific_challenge: string[];
  problem_area: string[];
  context: string[];
  pain_point: string[];
  target_user: string[];
  criteria: string[];
  business_process: string[];
  timeframe: string[];
  environment: string[];
  'product/service': string[];
  aspect: string[];
}

@Injectable()
export class VariableBankService {
  private variableBank: Record<string, string[]> = {
    solution_type: [
      'content marketing platform',
      'content intelligence system',
      'content creation tool',
      'content analytics solution',
      'content strategy platform',
      'content management system',
      'content optimization tool'
    ],
    industry: [
      'content marketing',
      'digital marketing',
      'enterprise software',
      'marketing technology',
      'B2B software'
    ],
    approach: [
      'data-driven insights',
      'AI-powered optimization',
      'storytelling methodology',
      'content intelligence',
      'workflow automation',
      'performance analytics'
    ],
    target_segment: [
      'enterprise businesses',
      'B2B companies',
      'marketing agencies',
      'content teams',
      'global brands'
    ],
    aspect: [
      'content quality',
      'analytics capabilities',
      'workflow efficiency',
      'ROI measurement',
      'integration features',
      'scalability'
    ]
  };

  async getVariableValue(variable: string): Promise<string> {
    // Handle special variables
    if (variable === 'company_name') {
      return '{company_name}'; // This will be replaced later with actual company name
    }
    if (variable === 'product/service') {
      return '{product/service}'; // This will be replaced later with actual product/service
    }

    // Get random value from variable bank
    const values = this.variableBank[variable];
    if (!values || values.length === 0) {
      throw new Error(`No values found for variable: ${variable}`);
    }

    return values[Math.floor(Math.random() * values.length)];
  }

  async updateVariableBank(company: CompetitorEntity): Promise<void> {
    // Update solution types based on company's products
    if (company.products) {
      this.variableBank.solution_type = [
        ...new Set([...this.variableBank.solution_type, ...company.products])
      ];
    }

    // Update industry based on company's industry
    if (company.industry?.name) {
      this.variableBank.industry = [
        ...new Set([...this.variableBank.industry, company.industry.name])
      ];
    }

    // Update target segments based on company's keywords
    if (company.keywords) {
      this.variableBank.target_segment = [
        ...new Set([...this.variableBank.target_segment, ...company.keywords])
      ];
    }
  }

  getVariables(): string[] {
    return Object.keys(this.variableBank);
  }

  addVariableValues(variable: string, values: string[]): void {
    if (!this.variableBank[variable]) {
      this.variableBank[variable] = [];
    }
    this.variableBank[variable] = [
      ...new Set([...this.variableBank[variable], ...values])
    ];
  }

  getAllVariableTypes(): (keyof VariableBank)[] {
    return Object.keys(this.variableBank) as (keyof VariableBank)[];
  }

  getRandomVariable(variableType: keyof VariableBank): string {
    const variables = this.variableBank[variableType] || [];
    if (variables.length === 0) return '';
    return variables[Math.floor(Math.random() * variables.length)];
  }

  replaceVariablesInTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      // Escape special characters in the key for use in regex
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`{${escapedKey}}`, 'g');
      result = result.replace(regex, value);
    }
    return result;
  }

  generateRandomVariablesForTemplate(placeholders: string[]): Record<string, string> {
    const variables: Record<string, string> = {};
    for (const placeholder of placeholders) {
      if (this.variableBank[placeholder as keyof VariableBank]) {
        variables[placeholder] = this.getRandomVariable(placeholder as keyof VariableBank);
      }
    }
    return variables;
  }
} 