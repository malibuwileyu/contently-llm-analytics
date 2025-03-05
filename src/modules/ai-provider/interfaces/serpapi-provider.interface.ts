import { AIProviderOptions, AIProviderResponse } from './ai-provider.interface';

/**
 * SerpAPI Engine Types
 */
export enum SerpAPIEngineType {
  GOOGLE = 'google',
  BING = 'bing',
  YAHOO = 'yahoo',
  DUCKDUCKGO = 'duckduckgo',
}

/**
 * SerpAPI Provider Options
 */
export interface SerpAPIProviderOptions extends AIProviderOptions {
  defaultEngine?: SerpAPIEngineType;
  numResults?: number;
  country?: string;
  language?: string;
  baseURL?: string;
}

/**
 * SerpAPI Search Options
 */
export interface SerpAPISearchOptions {
  engine?: SerpAPIEngineType;
  numResults?: number;
  country?: string;
  language?: string;
  includeMetadata?: boolean;
  includeImages?: boolean;
  includeVideos?: boolean;
  includeNews?: boolean;
  includeShopping?: boolean;
}

/**
 * SerpAPI Search Result
 */
export interface SerpAPISearchResult {
  title: string;
  snippet: string;
  url: string;
  position: number;
  metadata?: {
    domain: string;
    timestamp: string;
    type: string;
  };
}

/**
 * SerpAPI Provider Response
 */
export interface SerpAPIProviderResponse<T = Record<string, unknown>>
  extends AIProviderResponse<T> {
  metadata: AIProviderResponse<T>['metadata'] & {
    engine: SerpAPIEngineType;
    totalResults?: number;
    searchTime?: number;
  };
}
