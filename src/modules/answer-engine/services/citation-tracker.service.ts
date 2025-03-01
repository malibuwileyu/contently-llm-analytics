import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Citation } from '../entities/citation.entity';
import { CreateCitationDto } from '../interfaces/citation.interface';
import { BrandMention } from '../entities/brand-mention.entity';

/**
 * Service for calculating authority of sources
 */
interface AuthorityCalculatorService {
  calculateAuthority(source: string): Promise<number>;
}

/**
 * Service for tracking citations in content
 */
@Injectable()
export class CitationTrackerService {
  constructor(
    @InjectRepository(Citation)
    private readonly citationRepo: Repository<Citation>,
    private readonly authorityCalculator: AuthorityCalculatorService,
  ) {}

  /**
   * Track a citation
   * @param citation Citation data
   * @returns Created citation
   */
  async trackCitation(citation: CreateCitationDto): Promise<Citation> {
    // Calculate authority score for the citation source
    const authority = await this.authorityCalculator.calculateAuthority(
      citation.source,
    );

    // Create and save the citation
    const newCitation = this.citationRepo.create({
      source: citation.source,
      text: citation.source, // Using source as text for now
      authority,
      metadata: citation.metadata || {},
      brandMention: citation.brandMention as BrandMention,
      brandMentionId: (citation.brandMention as BrandMention).id,
    });

    return this.citationRepo.save(newCitation);
  }

  /**
   * Get citations by brand mention ID
   * @param brandMentionId ID of the brand mention
   * @returns Array of citations
   */
  async getCitationsByBrandMention(
    brandMentionId: string,
  ): Promise<Citation[]> {
    return this.citationRepo.find({
      where: { brandMention: { id: brandMentionId } },
      order: { authority: 'DESC' },
    });
  }

  /**
   * Get top citations by authority
   * @param limit Maximum number of citations to return
   * @returns Array of top citations
   */
  async getTopCitations(limit: number = 10): Promise<Citation[]> {
    return this.citationRepo.find({
      order: { authority: 'DESC' },
      take: limit,
    });
  }
}
