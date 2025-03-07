import { Injectable } from '@nestjs/common';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { CompanyProfileEntity } from '../entities/company-profile.entity';
import { CompetitorAnalysisService } from './competitor-analysis.service';
import { PerplexityService } from './perplexity.service';

interface CompetitorMention {
  name: string;
  position: number;
  sentiment: number;
  context: string;
}

interface CompetitiveInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  description: string;
  competitors: string[];
  confidence: number;
}

@Injectable()
export class ComparativeQueryService {
  constructor(
    private readonly competitorAnalysisService: CompetitorAnalysisService,
    private readonly perplexityService: PerplexityService
  ) {}

  async generateComparativeQueries(
    company: CompetitorEntity,
    count: number
  ): Promise<string[]> {
    // Get competitive landscape
    const landscape = await this.competitorAnalysisService.generateCompetitiveLandscape(company);
    
    // Get company profiles
    const mainProfile = await this.perplexityService.generateCompanyProfile(company);
    
    const prompt = `
      Generate ${count} comparative analysis questions about market presence and competition.
      
      Main Company:
      - Name: ${company.name}
      - Core Offering: ${mainProfile.core_offering}
      - Key Technologies: ${mainProfile.key_technologies.join(', ')}
      
      Direct Competitors:
      ${landscape.directCompetitors.map(c => `- ${c.competitor.name}`).join('\n')}
      
      Market Segments:
      ${landscape.marketSegments.map(s => `- ${s.segment} (${s.totalPlayers} players)`).join('\n')}
      
      Generate questions that:
      1. Compare market positioning
      2. Analyze competitive advantages
      3. Evaluate market share and presence
      4. Assess technology leadership
      5. Compare customer segments
      
      Format the response as a JSON object with this structure:
      {
        "questions": ["question 1", "question 2", ...]
      }
    `;

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a competitive analysis expert. Generate insightful comparative questions. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content).questions;
  }

  async analyzeCompetitorMentions(
    response: string,
    competitors: CompetitorEntity[]
  ): Promise<CompetitorMention[]> {
    const prompt = `
      Analyze this response for competitor mentions:
      "${response}"
      
      Competitors to look for:
      ${competitors.map(c => `- ${c.name}`).join('\n')}
      
      For each mention, provide:
      {
        "mentions": [
          {
            "name": "competitor name",
            "position": number (1-10, 1 being most prominent),
            "sentiment": number (-1 to 1),
            "context": "relevant snippet"
          }
        ]
      }
    `;

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a competitive analysis expert. Analyze text for competitor mentions and sentiment. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content).mentions;
  }

  async generateCompetitiveInsights(
    company: CompetitorEntity,
    responses: string[]
  ): Promise<CompetitiveInsight[]> {
    const landscape = await this.competitorAnalysisService.generateCompetitiveLandscape(company);
    const mainProfile = await this.perplexityService.generateCompanyProfile(company);

    const prompt = `
      Analyze these responses and generate competitive insights:
      ${responses.map((r, i) => `Response ${i + 1}: "${r}"`).join('\n\n')}
      
      Main Company:
      - Name: ${company.name}
      - Core Offering: ${mainProfile.core_offering}
      - Key Technologies: ${mainProfile.key_technologies.join(', ')}
      
      Direct Competitors:
      ${landscape.directCompetitors.map(c => `- ${c.competitor.name}`).join('\n')}
      
      Generate SWOT insights as:
      {
        "insights": [
          {
            "type": "strength" | "weakness" | "opportunity" | "threat",
            "description": "insight description",
            "competitors": ["relevant competitor names"],
            "confidence": number (0-100)
          }
        ]
      }
    `;

    const completion = await this.perplexityService['openai'].chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a competitive analysis expert. Generate strategic insights from market responses. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return JSON.parse(completion.choices[0].message.content).insights;
  }

  async calculateCompetitivePosition(
    mentions: CompetitorMention[],
    totalResponses: number
  ): Promise<Record<string, {
    mentionCount: number;
    averagePosition: number;
    averageSentiment: number;
    shareOfVoice: number;
  }>> {
    const positions = new Map<string, {
      mentions: number;
      totalPosition: number;
      totalSentiment: number;
    }>();

    // Aggregate mentions
    for (const mention of mentions) {
      if (!positions.has(mention.name)) {
        positions.set(mention.name, {
          mentions: 0,
          totalPosition: 0,
          totalSentiment: 0
        });
      }

      const stats = positions.get(mention.name);
      stats.mentions++;
      stats.totalPosition += mention.position;
      stats.totalSentiment += mention.sentiment;
    }

    // Calculate final metrics
    const result: Record<string, any> = {};
    for (const [name, stats] of positions.entries()) {
      result[name] = {
        mentionCount: stats.mentions,
        averagePosition: stats.totalPosition / stats.mentions,
        averageSentiment: stats.totalSentiment / stats.mentions,
        shareOfVoice: (stats.mentions / totalResponses) * 100
      };
    }

    return result;
  }
} 