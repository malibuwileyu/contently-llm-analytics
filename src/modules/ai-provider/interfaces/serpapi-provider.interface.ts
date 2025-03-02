import { AIProviderOptions, AIProviderResponse } from './ai-provider.interface';

/**
 * SerpAPI search engine types
 */
export enum SerpAPIEngineType {
  GOOGLE = 'google',
  BING = 'bing',
  YAHOO = 'yahoo',
  DUCKDUCKGO = 'duckduckgo',
  BAIDU = 'baidu',
  YANDEX = 'yandex',
}

/**
 * SerpAPI provider options
 */
export interface SerpAPIProviderOptions extends AIProviderOptions {
  /**
   * Default search engine to use
   */
  defaultEngine?: SerpAPIEngineType;

  /**
   * Default number of results to return
   */
  defaultNumResults?: number;

  /**
   * Default country code for search
   */
  defaultCountry?: string;

  /**
   * Default language for search
   */
  defaultLanguage?: string;
}

/**
 * SerpAPI search options
 */
export interface SerpAPISearchOptions {
  /**
   * Search engine to use
   */
  engine?: SerpAPIEngineType;

  /**
   * Number of results to return
   */
  numResults?: number;

  /**
   * Country code for search
   */
  country?: string;

  /**
   * Language for search
   */
  language?: string;

  /**
   * Whether to include images in results
   */
  includeImages?: boolean;

  /**
   * Whether to include videos in results
   */
  includeVideos?: boolean;

  /**
   * Whether to include news in results
   */
  includeNews?: boolean;

  /**
   * Whether to include shopping results
   */
  includeShopping?: boolean;

  /**
   * Location for local search
   */
  location?: string;

  /**
   * Safe search level
   */
  safeSearch?: 'off' | 'moderate' | 'active';
}

/**
 * SerpAPI search result
 */
export interface SerpAPISearchResult {
  /**
   * Result title
   */
  title: string;

  /**
   * Result URL
   */
  link: string;

  /**
   * Result snippet
   */
  snippet: string;

  /**
   * Result position
   */
  position: number;

  /**
   * Additional result data
   */
  [key: string]: unknown;
}

/**
 * SerpAPI provider response
 */
export interface SerpAPIProviderResponse extends AIProviderResponse {
  /**
   * SerpAPI-specific metadata
   */
  metadata: AIProviderResponse['metadata'] & {
    /**
     * Search engine used
     */
    engine: SerpAPIEngineType;

    /**
     * Search query
     */
    query: string;

    /**
     * Total results found
     */
    totalResults?: number;

    /**
     * Search parameters used
     */
    searchParams: Record<string, unknown>;
  };

  /**
   * Standardized search results
   */
  data: {
    /**
     * Organic search results
     */
    organicResults: SerpAPISearchResult[];

    /**
     * Featured snippet if available
     */
    featuredSnippet?: {
      title: string;
      content: string;
      source: string;
      link: string;
    };

    /**
     * Knowledge graph data if available
     */
    knowledgeGraph?: Record<string, unknown>;

    /**
     * Related searches
     */
    relatedSearches?: string[];

    /**
     * Additional data
     */
    [key: string]: unknown;
  };
}
