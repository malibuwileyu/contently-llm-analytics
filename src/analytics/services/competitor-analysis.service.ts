import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { CompanyProfileEntity } from '../entities/company-profile.entity';
import { PerplexityService } from './perplexity.service';

interface CompetitorMatch {
  competitor: CompetitorEntity;
  profile: CompanyProfileEntity;
  matchScore: {
    overall: number;
    offeringMatch: number;
    techMatch: number;
    segmentMatch: number;
    valueMatch: number;
  };
}

interface CompetitiveLandscape {
  mainCompetitor: CompetitorEntity;
  directCompetitors: CompetitorMatch[];
  indirectCompetitors: CompetitorMatch[];
  marketSegments: {
    segment: string;
    competitors: string[];
    totalPlayers: number;
  }[];
  competitiveAdvantages: {
    competitor: string;
    advantages: string[];
  }[];
}

@Injectable()
export class CompetitorAnalysisService {
  constructor(
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
    @InjectRepository(CompanyProfileEntity)
    private readonly companyProfileRepository: Repository<CompanyProfileEntity>,
    private readonly perplexityService: PerplexityService
  ) {}

  private async retryWithValidJSON<T>(
    operation: () => Promise<{ choices: Array<{ message: { content: string } }> }>,
    maxRetries = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const completion = await operation();
        const content = completion.choices[0].message.content.trim();
        
        // Try to extract JSON from the response if it's not already JSON
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;
        
        return JSON.parse(jsonStr);
      } catch (error) {
        lastError = error;
        console.warn(`Attempt ${i + 1} failed:`, error.message);
      }
    }
    
    throw lastError;
  }

  async discoverCompetitors(company: CompetitorEntity): Promise<CompetitorEntity[]> {
    const profile = await this.perplexityService.generateCompanyProfile(company);
    
    const prompt = `
      Analyze this company and identify its main competitors:
      Company: ${company.name}
      Industry: ${company.industry?.name || 'Unknown'}
      Profile:
      - Core Offering: ${profile.core_offering}
      - Key Technologies: ${profile.key_technologies.join(', ')}
      - Target Segments: ${profile.target_segments.join(', ')}

      Return your response in this exact JSON format:
      { "competitors": ["Company1", "Company2", ...] }

      List only the most relevant direct competitors.
    `;

    const { competitors } = await this.retryWithValidJSON<{ competitors: string[] }>(() =>
      this.perplexityService['openai'].chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a competitive intelligence expert. Identify relevant competitors based on company profiles. Always respond with valid JSON containing only the requested fields." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    );
    
    // Find or create competitor entities
    const competitorEntities: CompetitorEntity[] = [];
    for (const name of competitors) {
      let competitor = await this.competitorRepository.findOne({
        where: { name },
        relations: ['industry']
      });

      if (!competitor) {
        competitor = this.competitorRepository.create({
          name,
          industry: company.industry,
          isCustomer: false
        });
        await this.competitorRepository.save(competitor);
      }

      competitorEntities.push(competitor);
    }

    return competitorEntities;
  }

  async calculateCompetitorMatch(
    mainProfile: CompanyProfileEntity,
    competitorProfile: CompanyProfileEntity
  ): Promise<CompetitorMatch> {
    const prompt = `
      Calculate match scores between two company profiles:
      
      Main Company:
      - Core Offering: ${mainProfile.core_offering}
      - Technologies: ${mainProfile.key_technologies.join(', ')}
      - Segments: ${mainProfile.target_segments.join(', ')}
      - Value Props: ${mainProfile.value_propositions.join(', ')}

      Competitor:
      - Core Offering: ${competitorProfile.core_offering}
      - Technologies: ${competitorProfile.key_technologies.join(', ')}
      - Segments: ${competitorProfile.target_segments.join(', ')}
      - Value Props: ${competitorProfile.value_propositions.join(', ')}

      Return your response in this exact JSON format:
      {
        "overall": number,
        "offeringMatch": number,
        "techMatch": number,
        "segmentMatch": number,
        "valueMatch": number
      }

      All scores should be numbers between 0 and 100.
    `;

    const matchScore = await this.retryWithValidJSON<{
      overall: number;
      offeringMatch: number;
      techMatch: number;
      segmentMatch: number;
      valueMatch: number;
    }>(() =>
      this.perplexityService['openai'].chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { 
            role: "system", 
            content: "You are a competitive analysis expert. Calculate similarity scores between company profiles. Always respond with valid JSON containing only the requested fields." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    );

    return {
      competitor: await this.competitorRepository.findOne({ where: { id: competitorProfile.companyId } }),
      profile: competitorProfile,
      matchScore
    };
  }

  async generateCompetitiveLandscape(company: CompetitorEntity): Promise<CompetitiveLandscape> {
    // Get main company profile
    const mainProfile = await this.perplexityService.generateCompanyProfile(company);
    
    // Discover competitors
    const competitors = await this.discoverCompetitors(company);
    
    // Generate profiles and calculate matches for all competitors
    const competitorMatches: CompetitorMatch[] = [];
    for (const competitor of competitors) {
      const profile = await this.perplexityService.generateCompanyProfile(competitor);
      const match = await this.calculateCompetitorMatch(mainProfile, profile);
      competitorMatches.push(match);
    }

    // Sort and categorize competitors
    const directThreshold = 70; // Matches above this are considered direct competitors
    const directCompetitors = competitorMatches
      .filter(match => match.matchScore.overall >= directThreshold)
      .sort((a, b) => b.matchScore.overall - a.matchScore.overall);

    const indirectCompetitors = competitorMatches
      .filter(match => match.matchScore.overall < directThreshold)
      .sort((a, b) => b.matchScore.overall - a.matchScore.overall);

    // Analyze market segments
    const segments = new Map<string, Set<string>>();
    for (const match of competitorMatches) {
      for (const segment of match.profile.target_segments) {
        if (!segments.has(segment)) {
          segments.set(segment, new Set());
        }
        segments.get(segment).add(match.competitor.name);
      }
    }

    const marketSegments = Array.from(segments.entries()).map(([segment, competitors]) => ({
      segment,
      competitors: Array.from(competitors),
      totalPlayers: competitors.size
    }));

    // Analyze competitive advantages
    const competitiveAdvantages = await Promise.all(
      competitorMatches.map(async match => {
        const prompt = `
          Compare these companies and identify competitive advantages:
          
          Company 1:
          ${mainProfile.core_offering}
          ${mainProfile.value_propositions.join(', ')}
          
          Company 2:
          ${match.profile.core_offering}
          ${match.profile.value_propositions.join(', ')}
          
          Return your response in this exact JSON format:
          {
            "advantages": ["advantage1", "advantage2", ...]
          }
        `;

        const { advantages } = await this.retryWithValidJSON<{ advantages: string[] }>(() =>
          this.perplexityService['openai'].chat.completions.create({
            model: "gpt-4",
            messages: [
              { 
                role: "system", 
                content: "You are a competitive analysis expert. Identify competitive advantages. Always respond with valid JSON containing only the requested fields." 
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
          })
        );

        return {
          competitor: match.competitor.name,
          advantages
        };
      })
    );

    return {
      mainCompetitor: company,
      directCompetitors,
      indirectCompetitors,
      marketSegments,
      competitiveAdvantages
    };
  }
} 