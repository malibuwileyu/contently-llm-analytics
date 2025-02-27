/**
 * Interface for citation data
 */
export interface Citation {
  /**
   * Source of the citation (URL, document reference, etc.)
   */
  source: string;
  
  /**
   * Authority score of the citation (0 to 1)
   */
  authority: number;
  
  /**
   * Additional metadata about the citation
   */
  metadata: Record<string, unknown>;
}

/**
 * Interface for creating a new citation
 */
export interface CreateCitationDto {
  /**
   * Source of the citation
   */
  source: string;
  
  /**
   * Brand mention the citation is associated with
   */
  brandMention: any; // This will be the actual BrandMention entity
  
  /**
   * Additional metadata about the citation
   */
  metadata?: Record<string, unknown>;
} 