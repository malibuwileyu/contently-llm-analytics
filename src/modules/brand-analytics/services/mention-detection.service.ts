import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CompetitorRepository } from '../repositories/competitor.repository';
import { MentionRepository } from '../repositories/mention.repository';
import { ResponseEntity } from '../entities/response.entity';
import { MentionEntity } from '../entities/mention.entity';
import { CompetitorEntity } from '../entities/competitor.entity';

@Injectable()
export class MentionDetectionService {
  private readonly logger = new Logger(MentionDetectionService.name);

  constructor(
    @InjectRepository(CompetitorRepository)
    private readonly competitorRepository: CompetitorRepository,
    @InjectRepository(MentionRepository)
    private readonly _mentionRepository: MentionRepository,
  ) {}

  /**
   * Process an AI response to detect brand mentions
   * @param response The AI response entity
   * @returns Array of detected mentions
   */
  async detectMentions(response: ResponseEntity): Promise<MentionEntity[]> {
    this.logger.debug(`Detecting mentions in response ${response.id}`);

    // Get all competitors for fuzzy matching
    const competitors = await this.competitorRepository.find();

    // Detect mentions for each competitor
    const detectedMentions: MentionEntity[] = [];

    for (const competitor of competitors) {
      const mentions = await this.detectCompetitorMentions(
        response,
        competitor,
      );
      detectedMentions.push(...mentions);
    }

    this.logger.debug(
      `Detected ${detectedMentions.length} mentions in response ${response.id}`,
    );
    return detectedMentions;
  }

  /**
   * Detect mentions of a specific competitor in a response
   * @param response The AI response entity
   * @param competitor The competitor entity
   * @returns Array of detected mentions
   */
  private async detectCompetitorMentions(
    response: ResponseEntity,
    competitor: CompetitorEntity,
  ): Promise<MentionEntity[]> {
    const text = response.text;
    const mentions: MentionEntity[] = [];

    // Check for exact name match
    const exactMatches = this.findExactMatches(text, competitor.name);

    // Check for alternate names
    const alternateMatches: {
      start: number;
      end: number;
      matchedText: string;
    }[] = [];
    if (competitor.alternateNames && competitor.alternateNames.length > 0) {
      for (const alternateName of competitor.alternateNames) {
        const matches = this.findExactMatches(text, alternateName);
        // Add the matched text to each match
        const matchesWithText = matches.map(match => ({
          ...match,
          matchedText: alternateName,
        }));
        alternateMatches.push(...matchesWithText);
      }
    }

    // Combine all matches and remove duplicates
    const exactMatchesWithText = exactMatches.map(match => ({
      ...match,
      matchedText: competitor.name,
    }));
    const allMatches = [...exactMatchesWithText, ...alternateMatches];
    const uniqueMatches = this.removeDuplicateMatches(allMatches);

    // Create mention entities for each match
    for (const match of uniqueMatches) {
      const mention = new MentionEntity();
      mention.text = text.substring(match.start, match.end);
      mention.context = this.extractContext(text, match.start, match.end);
      mention.startPosition = match.start;
      mention.endPosition = match.end;
      mention.competitorId = competitor.id;
      mention.responseId = response.id;
      mention.confidence = 1.0; // Exact match has high confidence

      // Extract associated features and products
      mention.associatedFeatures = this.extractAssociatedFeatures(
        text,
        match.start,
        match.end,
      );
      mention.associatedProducts = this.extractAssociatedProducts(
        text,
        match.start,
        match.end,
        competitor.products,
      );

      mentions.push(mention);
    }

    return mentions;
  }

  /**
   * Find exact matches of a term in text
   * @param text The text to search in
   * @param term The term to search for
   * @returns Array of match positions
   */
  private findExactMatches(
    text: string,
    term: string,
  ): { start: number; end: number }[] {
    const matches: { start: number; end: number }[] = [];
    const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, 'gi');

    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return matches;
  }

  /**
   * Escape special characters in a string for use in a regular expression
   * @param string The string to escape
   * @returns The escaped string
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Remove duplicate or overlapping matches
   * @param matches Array of match positions
   * @returns Array of unique match positions
   */
  private removeDuplicateMatches(
    matches: { start: number; end: number; matchedText?: string }[],
  ): { start: number; end: number; matchedText?: string }[] {
    // Sort matches by start position
    const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

    const uniqueMatches: {
      start: number;
      end: number;
      matchedText?: string;
    }[] = [];
    let lastEnd = -1;

    for (const match of sortedMatches) {
      // Skip if this match overlaps with the previous one
      if (match.start <= lastEnd) {
        continue;
      }

      uniqueMatches.push(match);
      lastEnd = match.end;
    }

    return uniqueMatches;
  }

  /**
   * Extract context around a mention
   * @param text The full text
   * @param start Start position of the mention
   * @param end End position of the mention
   * @param contextSize Number of characters to include before and after
   * @returns The context string
   */
  private extractContext(
    text: string,
    start: number,
    end: number,
    contextSize = 100,
  ): string {
    const contextStart = Math.max(0, start - contextSize);
    const contextEnd = Math.min(text.length, end + contextSize);

    return text.substring(contextStart, contextEnd);
  }

  /**
   * Extract features associated with a mention
   * @param text The full text
   * @param start Start position of the mention
   * @param end End position of the mention
   * @returns Array of associated features
   */
  private extractAssociatedFeatures(
    text: string,
    start: number,
    end: number,
  ): string[] {
    // This is a simplified implementation
    // In a real _system, you would use NLP to extract features
    const features: string[] = [];
    const context = this.extractContext(text, start, end, 200);

    // Common feature keywords to look for
    const featureKeywords = [
      'quality',
      'price',
      'design',
      'comfort',
      'durability',
      'performance',
      'style',
      'support',
      'lightweight',
      'waterproof',
    ];

    for (const keyword of featureKeywords) {
      if (context.toLowerCase().includes(keyword)) {
        features.push(keyword);
      }
    }

    return features;
  }

  /**
   * Extract products associated with a mention
   * @param text The full text
   * @param start Start position of the mention
   * @param end End position of the mention
   * @param knownProducts Array of known products for the competitor
   * @returns Array of associated products
   */
  private extractAssociatedProducts(
    text: string,
    start: number,
    end: number,
    knownProducts: string[] = [],
  ): string[] {
    const products: string[] = [];
    const context = this.extractContext(text, start, end, 200);

    // Check for known products in the context
    if (knownProducts && knownProducts.length > 0) {
      for (const product of knownProducts) {
        if (context.toLowerCase().includes(product.toLowerCase())) {
          products.push(product);
        }
      }
    }

    return products;
  }
}
