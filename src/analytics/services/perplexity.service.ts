import { Injectable } from '@nestjs/common';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { CompanyProfileEntity } from '../entities/company-profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ContextKeywords {
  core_terms: string[];
  technology_terms: string[];
  industry_terms: string[];
  business_terms: string[];
}

@Injectable()
export class PerplexityService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(CompanyProfileEntity)
    private readonly companyProfileRepository: Repository<CompanyProfileEntity>,
    private readonly configService: ConfigService
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY')
    });
  }

  async generateCompanyProfile(company: CompetitorEntity): Promise<CompanyProfileEntity> {
    // First check if profile exists
    const existingProfile = await this.companyProfileRepository.findOne({
      where: { companyId: company.id }
    });

    if (existingProfile) {
      return existingProfile;
    }

    // Generate profile using GPT-4
    const prompt = `
      Analyze the following company and provide a detailed profile:
      Company Name: ${company.name}
      Industry: ${company.industry?.name || 'Unknown'}
      Website: ${company.website || 'N/A'}

      Please provide:
      1. Core offering (main products/services)
      2. Unique approaches or methodologies
      3. Key technologies used or developed
      4. Target market segments
      5. Key value propositions

      Format the response as a structured JSON object with these fields:
      {
        "core_offering": "string",
        "unique_approaches": ["string"],
        "key_technologies": ["string"],
        "target_segments": ["string"],
        "value_propositions": ["string"]
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a business analyst specializing in technology companies. Provide accurate, well-researched company profiles based on available information. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const profileData = JSON.parse(completion.choices[0].message.content);

    // Create and save new profile
    const profile = this.companyProfileRepository.create({
      companyId: company.id,
      core_offering: profileData.core_offering,
      unique_approaches: profileData.unique_approaches,
      key_technologies: profileData.key_technologies,
      target_segments: profileData.target_segments,
      value_propositions: profileData.value_propositions
    });

    return this.companyProfileRepository.save(profile);
  }

  async extractContextualKeywords(profile: CompanyProfileEntity): Promise<ContextKeywords> {
    const prompt = `
      Extract and categorize keywords from this company profile:

      Core Offering: ${profile.core_offering}
      Unique Approaches: ${profile.unique_approaches.join(', ')}
      Key Technologies: ${profile.key_technologies.join(', ')}
      Target Segments: ${profile.target_segments.join(', ')}
      Value Propositions: ${profile.value_propositions.join(', ')}

      Format the response as a JSON object with these categories:
      {
        "core_terms": ["business-critical terms"],
        "technology_terms": ["technical terms"],
        "industry_terms": ["industry-specific terms"],
        "business_terms": ["general business terms"]
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a keyword extraction expert. Extract and categorize relevant keywords from company profiles. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async generateContextualQueries(
    profile: CompanyProfileEntity,
    keywords: ContextKeywords,
    count: number
  ): Promise<string[]> {
    const prompt = `
      Generate ${count} contextually relevant questions about this company's market presence.
      Use these company details and keywords:

      Company Profile:
      - Core Offering: ${profile.core_offering}
      - Key Technologies: ${profile.key_technologies.join(', ')}
      - Target Segments: ${profile.target_segments.join(', ')}

      Keywords:
      - Core Terms: ${keywords.core_terms.join(', ')}
      - Technology Terms: ${keywords.technology_terms.join(', ')}
      - Industry Terms: ${keywords.industry_terms.join(', ')}
      - Business Terms: ${keywords.business_terms.join(', ')}

      Generate questions that:
      1. Are specific to the company's context
      2. Focus on market presence and visibility
      3. Include relevant keywords naturally
      4. Vary in focus and perspective

      Format the response as a JSON object with this structure:
      {
        "questions": ["question 1", "question 2", ...]
      }
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a market research expert. Generate relevant questions for analyzing a company's market presence and visibility. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    return JSON.parse(completion.choices[0].message.content).questions;
  }

  async generateResponse(query: string): Promise<string> {
    const prompt = `
      Analyze this query about market presence and brand visibility:
      "${query}"

      Provide a detailed response that:
      1. Focuses on market presence and visibility
      2. Includes specific examples and evidence
      3. Maintains objectivity
      4. Considers industry context

      Keep the response under 200 words and focus on factual information.
    `;

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a market research expert. Provide objective, evidence-based responses about brand visibility and market presence." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0].message.content;
  }
} 