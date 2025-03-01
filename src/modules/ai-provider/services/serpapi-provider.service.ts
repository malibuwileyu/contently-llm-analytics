import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider } from './base-ai-provider.service';
import {
  AIProviderResponse,
  SerpAPIProviderOptions,
  SerpAPIEngineType,
  SerpAPISearchOptions,
  SerpAPISearchResult,
} from '../interfaces';

/**
 * SerpAPI provider service
 */
@Injectable()
export class SerpAPIProviderService extends BaseAIProvider {
  private client: AxiosInstance;
  private readonly defaultEngine: SerpAPIEngineType;
  private readonly defaultNumResults: number;
  private readonly defaultCountry: string;
  private readonly defaultLanguage: string;

  /**
   * Constructor
   * @param options SerpAPI provider options
   */
  constructor(options: SerpAPIProviderOptions) {
    super('SerpAPI', options);

    this.defaultEngine = options.defaultEngine || SerpAPIEngineType.GOOGLE;
    this.defaultNumResults = options.defaultNumResults || 10;
    this.defaultCountry = options.defaultCountry || 'us';
    this.defaultLanguage = options.defaultLanguage || 'en';

    try {
      this.client = axios.create({
        baseURL: options.baseUrl || 'https://serpapi.com',
        timeout: options.timeoutMs || 30000,
      });
    } catch (error) {
      this.available = false;
      this.logger.error('Failed to initialize SerpAPI client', error);
    }
  }

  /**
   * Get the provider's capabilities
   */
  getCapabilities(): string[] {
    return ['search'];
  }

  /**
   * Execute a text completion request (not supported by SerpAPI)
   * @param prompt The prompt to complete
   * @param options Additional options for the request
   */
  async complete(
    _prompt: string,
    _options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    throw new Error('Text completion is not supported by SerpAPI provider');
  }

  /**
   * Execute a chat completion request (not supported by SerpAPI)
   * @param messages The chat messages
   * @param options Additional options for the request
   */
  async chat(
    _messages: Array<{ role: string; content: string }>,
    _options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    throw new Error('Chat completion is not supported by SerpAPI provider');
  }

  /**
   * Execute an embedding request (not supported by SerpAPI)
   * @param text The text to embed
   * @param options Additional options for the request
   */
  async embed(
    _text: string,
    _options: Record<string, unknown> = {},
  ): Promise<AIProviderResponse> {
    throw new Error('Embedding is not supported by SerpAPI provider');
  }

  /**
   * Execute a search request
   * @param query The search query
   * @param options Additional options for the request
   */
  async search(
    query: string,
    options: SerpAPISearchOptions = {},
  ): Promise<AIProviderResponse> {
    try {
      const startTime = Date.now();

      const engine = options.engine || this.defaultEngine;
      const params = {
        q: query,
        api_key: this.options.apiKey,
        num: options.numResults || this.defaultNumResults,
        gl: options.country || this.defaultCountry,
        hl: options.language || this.defaultLanguage,
        safe: options.safeSearch || 'active',
        location: options.location,
        tbm: this.buildTbmParameter(options),
      };

      const response = await this.client.get(`/search.json`, { params });
      const data = response.data;
      const latencyMs = Date.now() - startTime;

      // Process the search results
      const organicResults = this.extractOrganicResults(data);
      const featuredSnippet = this.extractFeaturedSnippet(data);
      const knowledgeGraph = data.knowledge_graph || null;
      const relatedSearches = this.extractRelatedSearches(data);

      return this.createResponse(
        data,
        {
          organicResults,
          featuredSnippet,
          knowledgeGraph,
          relatedSearches,
          totalResults: data.search_information?.total_results,
        },
        {
          engine,
          query,
          latencyMs,
          totalResults: data.search_information?.total_results,
          searchParams: params,
        },
      );
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  /**
   * Build the tbm parameter for SerpAPI
   * @param options Search options
   */
  private buildTbmParameter(options: SerpAPISearchOptions): string | undefined {
    const tbmParts = [];

    if (options.includeImages) tbmParts.push('isch');
    if (options.includeVideos) tbmParts.push('vid');
    if (options.includeNews) tbmParts.push('nws');
    if (options.includeShopping) tbmParts.push('shop');

    return tbmParts.length > 0 ? tbmParts.join(',') : undefined;
  }

  /**
   * Extract organic results from SerpAPI response
   * @param data Response data
   */
  private extractOrganicResults(data: any): SerpAPISearchResult[] {
    const organicResults = data.organic_results || [];

    return organicResults.map((result: any, index: number) => ({
      title: result.title || '',
      link: result.link || '',
      snippet: result.snippet || '',
      position: index + 1,
      displayedLink: result.displayed_link,
      sitelinks: result.sitelinks,
      thumbnail: result.thumbnail,
    }));
  }

  /**
   * Extract featured snippet from SerpAPI response
   * @param data Response data
   */
  private extractFeaturedSnippet(
    data: any,
  ):
    | { title: string; content: string; source: string; link: string }
    | undefined {
    const answerBox = data.answer_box;

    if (!answerBox) return undefined;

    return {
      title: answerBox.title || '',
      content: answerBox.answer || answerBox.snippet || '',
      source: answerBox.displayed_link || '',
      link: answerBox.link || '',
    };
  }

  /**
   * Extract related searches from SerpAPI response
   * @param data Response data
   */
  private extractRelatedSearches(data: any): string[] {
    const relatedSearches = data.related_searches || [];

    return relatedSearches.map((search: any) => search.query || '');
  }
}
