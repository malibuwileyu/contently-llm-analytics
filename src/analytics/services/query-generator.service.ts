import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryTemplateEntity } from '../entities/query-template.entity';
import { VariableBankService } from './variable-bank.service';
import { QueryType } from '../types/query.types';

@Injectable()
export class QueryGeneratorService {
  constructor(
    @InjectRepository(QueryTemplateEntity)
    private readonly queryTemplateRepository: Repository<QueryTemplateEntity>,
    private readonly variableBankService: VariableBankService
  ) {}

  async generateQueriesForType(type: QueryType, count: number): Promise<string[]> {
    const templates = await this.queryTemplateRepository.find({
      where: { type, isActive: true },
      order: { priority: 'DESC' }
    });

    if (templates.length === 0) {
      throw new Error(`No templates found for type: ${type}`);
    }

    const queries = new Set<string>();
    const maxAttempts = count * 2; // Allow for some retries in case of duplicates
    let attempts = 0;

    while (queries.size < count && attempts < maxAttempts) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const variables = this.variableBankService.generateRandomVariablesForTemplate(template.variables || []);
      const query = this.variableBankService.replaceVariablesInTemplate(template.template, variables);
      
      if (!queries.has(query)) {
        queries.add(query);
      }
      
      attempts++;
    }

    return Array.from(queries);
  }

  async generateQueriesForAllTypes(countPerType: number): Promise<Record<QueryType, string[]>> {
    const types: QueryType[] = ['industry', 'context', 'competitive'];
    const result: Record<QueryType, string[]> = {} as Record<QueryType, string[]>;

    for (const type of types) {
      result[type] = await this.generateQueriesForType(type, countPerType);
    }

    return result;
  }

  async validateQuery(query: string): Promise<boolean> {
    // Basic validation rules
    if (!query || query.length < 10) return false;
    if (query.includes('{') || query.includes('}')) return false; // Check for unreplaced variables
    
    // Check for minimum word count (assuming questions should be at least 5 words)
    const wordCount = query.split(/\s+/).length;
    if (wordCount < 5) return false;

    // Check for question structure (should start with question words)
    const questionWords = ['what', 'how', 'which', 'why', 'where', 'when', 'who', 'compare'];
    const startsWithQuestionWord = questionWords.some(word => 
      query.toLowerCase().startsWith(word)
    );
    if (!startsWithQuestionWord) return false;

    return true;
  }

  async generateValidatedQueries(type: QueryType, count: number): Promise<string[]> {
    const validQueries: string[] = [];
    const maxAttempts = count * 3; // Allow for more retries when validation is involved
    let attempts = 0;

    while (validQueries.length < count && attempts < maxAttempts) {
      const queries = await this.generateQueriesForType(type, count - validQueries.length);
      
      for (const query of queries) {
        if (await this.validateQuery(query)) {
          validQueries.push(query);
          if (validQueries.length >= count) break;
        }
      }
      
      attempts++;
    }

    if (validQueries.length < count) {
      throw new Error(`Could not generate enough valid queries for type: ${type}`);
    }

    return validQueries;
  }
} 