import { Injectable } from '@nestjs/common';
import { BrandVisibilityService } from '../services/brand-visibility.service';

export interface BrandVisibilityRunnerInput {
  companyId: string;
  industry: string;
  question: string;
}

export interface BrandVisibilityRunnerOutput {
  companyId: string;
  analysis: string;
  timestamp: string;
}

@Injectable()
export class BrandVisibilityRunner {
  constructor(private readonly service: BrandVisibilityService) {}

  async run(input: BrandVisibilityRunnerInput): Promise<BrandVisibilityRunnerOutput> {
    const company = await this.service.getCompanyDetails(input.companyId);
    if (!company) {
      throw new Error(`Company with ID ${input.companyId} not found`);
    }

    const analysis = await this.service.analyzeBrandVisibility(company, input.question);

    return {
      companyId: company.id,
      analysis,
      timestamp: new Date().toISOString(),
    };
  }
} 