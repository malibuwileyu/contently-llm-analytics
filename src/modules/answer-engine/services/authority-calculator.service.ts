import { Injectable } from '@nestjs/common';
import { CacheService } from '../../../cache/cache.service';
import { createHash } from 'crypto';

/**
 * Service for calculating authority scores for citation sources
 */
@Injectable()
export class AuthorityCalculatorService {
  // Domain authority scores (0-1)
  private readonly domainScores: Record<string, number> = {
    'wikipedia.org': 0.9,
    'github.com': 0.85,
    'arxiv.org': 0.88,
    'scholar.google.com': 0.92,
    'research.gov': 0.95,
    'nih.gov': 0.95,
    'edu': 0.85,
    'gov': 0.9,
    'org': 0.75,
    'com': 0.6,
    'net': 0.6,
    'io': 0.65,
  };

  constructor(private readonly cacheService: CacheService) {}

  /**
   * Calculate authority score for a source
   * @param source URL or reference to the source
   * @returns Authority score between 0 and 1
   */
  async calculateAuthority(source: string): Promise<number> {
    // Create a cache key based on the source
    const cacheKey = `authority:${createHash('md5').update(source).digest('hex')}`;
    
    // Try to get from cache first, or compute and cache if not found
    return this.cacheService.getOrSet<number>(
      cacheKey,
      async () => {
        // Extract domain from URL
        const domain = this.extractDomain(source);
        
        // Calculate base score from domain
        let score = this.calculateDomainScore(domain);
        
        // Apply additional factors
        score = this.applySourceFactors(source, score);
        
        // Ensure score is between 0 and 1
        return Math.max(0, Math.min(1, score));
      },
      86400 // Cache for 24 hours
    );
  }

  /**
   * Extract domain from a URL
   * @param url URL to extract domain from
   * @returns Domain name
   */
  private extractDomain(url: string): string {
    try {
      // Handle URLs without protocol
      if (!url.startsWith('http')) {
        url = `https://${url}`;
      }
      
      const domain = new URL(url).hostname.toLowerCase();
      return domain;
    } catch (error) {
      // If URL parsing fails, return the original string
      return url.toLowerCase();
    }
  }

  /**
   * Calculate base score from domain
   * @param domain Domain name
   * @returns Base authority score
   */
  private calculateDomainScore(domain: string): number {
    // Check for exact domain match
    if (this.domainScores[domain]) {
      return this.domainScores[domain];
    }
    
    // Check for domain suffix match
    for (const [key, score] of Object.entries(this.domainScores)) {
      if (domain.endsWith(`.${key}`)) {
        return score;
      }
    }
    
    // Default score for unknown domains
    return 0.5;
  }

  /**
   * Apply additional factors to the authority score
   * @param source Source URL or reference
   * @param baseScore Base authority score
   * @returns Adjusted authority score
   */
  private applySourceFactors(source: string, baseScore: number): number {
    let score = baseScore;
    
    // HTTPS bonus
    if (source.startsWith('https://')) {
      score += 0.05;
    }
    
    // Academic paper pattern bonus
    if (source.includes('doi.org') || source.includes('arxiv.org')) {
      score += 0.1;
    }
    
    // Government source bonus
    if (source.includes('.gov/')) {
      score += 0.1;
    }
    
    // Educational source bonus
    if (source.includes('.edu/')) {
      score += 0.08;
    }
    
    // Research organization bonus
    if (source.includes('research') || source.includes('institute') || source.includes('foundation')) {
      score += 0.05;
    }
    
    // Penalty for suspicious patterns
    if (source.includes('blog') || source.includes('forum')) {
      score -= 0.1;
    }
    
    return score;
  }
} 