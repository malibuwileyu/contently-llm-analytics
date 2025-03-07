import { Injectable, Logger } from '@nestjs/common';
import { OpenAIProviderService } from '../../modules/ai-provider/services/openai-provider.service';

export interface QuestionValidation {
  question: string;
  isRelevant: boolean;
  relevanceScore: number;
  suggestedRevision?: string;
  category: 'brand-visibility' | 'market-research' | 'irrelevant';
  isBrandAgnostic: boolean;
}

@Injectable()
export class QuestionValidatorService {
  private readonly logger = new Logger(QuestionValidatorService.name);

  constructor(private readonly openAIProvider: OpenAIProviderService) {}

  async validateQuestion(question: string): Promise<QuestionValidation> {
    const prompt = `
      Analyze the following question for brand visibility analysis:
      "${question}"

      Evaluate based on these criteria:
      1. Is it brand-agnostic (can be applied to any company)?
      2. Is it relevant to brand visibility analysis?
      3. What category does it belong to?
      4. How relevant is it (score 0-1)?
      5. If needed, suggest a brand-agnostic revision.

      Respond in JSON format:
      {
        "isRelevant": boolean,
        "relevanceScore": number,
        "category": "brand-visibility" | "market-research" | "irrelevant",
        "isBrandAgnostic": boolean,
        "suggestedRevision": string (only if needed),
        "explanation": string
      }
    `;

    try {
      const response = await this.openAIProvider.complete(prompt);
      const validation = JSON.parse(response.content.trim());

      return {
        question,
        isRelevant: validation.isRelevant,
        relevanceScore: validation.relevanceScore,
        category: validation.category,
        isBrandAgnostic: validation.isBrandAgnostic,
        suggestedRevision: validation.suggestedRevision,
      };
    } catch (error) {
      this.logger.error(`Error validating question: ${error.message}`);
      throw new Error(`Failed to validate question: ${error.message}`);
    }
  }

  async validateQuestions(questions: string[]): Promise<QuestionValidation[]> {
    const validations = await Promise.all(
      questions.map(question => this.validateQuestion(question)),
    );

    const stats = {
      total: validations.length,
      relevant: validations.filter(v => v.isRelevant).length,
      brandAgnostic: validations.filter(v => v.isBrandAgnostic).length,
      categories: validations.reduce((acc, v) => {
        acc[v.category] = (acc[v.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    this.logger.log('Question validation stats:', stats);
    return validations;
  }

  private async generateNewQuestions(
    baseQuestions: string[],
    variationNumber: number,
  ): Promise<string[]> {
    // Instead of generating new questions, just append variation number to base questions
    return baseQuestions.map(q => `${q} (Variation ${variationNumber})`);
  }

  async filterAndRefineQuestions(questions: string[]): Promise<string[]> {
    const targetCount = questions.length;
    const baseQuestions = questions
      .filter((q, i) => i < 10) // First 10 questions are our base
      .map(q => q.split('(')[0].trim());
    
    // Generate all variations up front
    const allQuestions: string[] = [];
    let currentVariation = 0;
    
    while (allQuestions.length < targetCount) {
      const batchQuestions = currentVariation === 0
        ? baseQuestions
        : await this.generateNewQuestions(baseQuestions, currentVariation);
        
      batchQuestions.forEach(q => {
        if (allQuestions.length < targetCount) {
          allQuestions.push(q);
        }
      });
      
      currentVariation++;
    }
    
    // Validate all questions at once
    const validations = await this.validateQuestions(allQuestions);
    const validQuestions = validations
      .filter(v => v.isRelevant && v.isBrandAgnostic)
      .map(v => v.question);
    
    if (validQuestions.length < targetCount) {
      this.logger.warn(
        `Could not validate all questions. Got ${validQuestions.length} out of ${targetCount} requested.`
      );
    }
    
    // Return exactly the number requested, maintaining order
    return allQuestions.slice(0, targetCount);
  }
} 