import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCategoryEntity } from '../entities/business-category.entity';
import { QueryMetadataEntity } from '../entities/query-metadata.entity';
import {
  QueryCategorizationResponseDto,
  QueryIntentType,
  QueryTaggingResponseDto,
} from '../dto/query-categorization.dto';
import { performance } from 'perf_hooks';
import { AIProviderFactoryService } from '../../ai-provider/services/ai-provider-factory.service';
import { ProviderType } from '../../ai-provider/interfaces';

/**
 * Service for categorizing and tagging search queries
 */
@Injectable()
export class QueryCategorizationService {
  private readonly logger = new Logger(QueryCategorizationService.name);

  constructor(
    @InjectRepository(BusinessCategoryEntity)
    private readonly businessCategoryRepository: Repository<BusinessCategoryEntity>,
    @InjectRepository(QueryMetadataEntity)
    private readonly queryMetadataRepository: Repository<QueryMetadataEntity>,
    private readonly aiProviderFactory: AIProviderFactoryService,
  ) {}

  /**
   * Categorize a search query by intent and extract topics
   * @param query The search query to categorize
   * @returns Categorization results including intent, confidence, and topics
   */
  async categorizeQuery(
    query: string,
  ): Promise<QueryCategorizationResponseDto> {
    const startTime = performance.now();
    this.logger.log(`Categorizing query: "${query}"`);

    try {
      // Check if we already have this query categorized
      const existingMetadata = await this.queryMetadataRepository.findOne({
        where: { query },
      });

      if (existingMetadata && existingMetadata.intent) {
        this.logger.log(`Using cached categorization for query: "${query}"`);
        return {
          intent: existingMetadata.intent,
          confidence: existingMetadata.confidence || 0.5,
          topics: existingMetadata.topics || [],
          entities: existingMetadata.entities || [],
        };
      }

      // Get OpenAI provider from factory
      const openAIService = await this.aiProviderFactory.getBestProviderByType(
        ProviderType.OPENAI,
      );
      if (!openAIService) {
        throw new Error('No OpenAI provider available');
      }

      // Use OpenAI to categorize the query
      const prompt = this.buildCategorizationPrompt(query);
      const response = await openAIService.complete(prompt, {
        maxTokens: 500,
        temperature: 0.3,
      });

      // Parse the response
      const result = this.parseCategorizationResponse(response.data.text);

      // Store the categorization results
      await this.storeQueryMetadata(query, {
        categorization: result,
      });

      const endTime = performance.now();
      this.logger.log(
        `Categorized query in ${(endTime - startTime).toFixed(2)}ms with intent: ${result.intent}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error categorizing query: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Tag a search query with relevant metadata
   * @param query The search query to tag
   * @param categoryId Optional business category ID for context
   * @returns Tagging results including tags, brand mentions, and more
   */
  async tagQuery(
    query: string,
    categoryId?: string,
  ): Promise<QueryTaggingResponseDto> {
    const startTime = performance.now();
    this.logger.log(
      `Tagging query: "${query}"${categoryId ? ` for category ID: ${categoryId}` : ''}`,
    );

    try {
      // Check if we already have this query tagged
      const existingMetadata = await this.queryMetadataRepository.findOne({
        where: {
          query,
          ...(categoryId ? { businessCategoryId: categoryId } : {}),
        },
      });

      if (
        existingMetadata &&
        existingMetadata.tags &&
        existingMetadata.tags.length > 0
      ) {
        this.logger.log(`Using cached tagging for query: "${query}"`);
        return {
          tags: existingMetadata.tags || [],
          brandMentions: existingMetadata.brandMentions || [],
          productCategories: existingMetadata.productCategories || [],
          features: existingMetadata.features || [],
          sentiment: existingMetadata.sentiment,
        };
      }

      let categoryContext = '';
      let category = null;

      // If category ID is provided, get category information for context
      if (categoryId) {
        category = await this.businessCategoryRepository.findOne({
          where: { id: categoryId },
        });

        if (category) {
          categoryContext = `Business Category: ${category.name}\n`;
          if (category.keywords && category.keywords.length > 0) {
            categoryContext += `Category Keywords: ${category.keywords.join(', ')}\n`;
          }
        }
      }

      // Get OpenAI provider from factory
      const openAIService = await this.aiProviderFactory.getBestProviderByType(
        ProviderType.OPENAI,
      );
      if (!openAIService) {
        throw new Error('No OpenAI provider available');
      }

      // Use OpenAI to tag the query
      const prompt = this.buildTaggingPrompt(query, categoryContext);
      const response = await openAIService.complete(prompt, {
        maxTokens: 500,
        temperature: 0.3,
      });

      // Parse the response
      const result = this.parseTaggingResponse(response.data.text);

      // Store the tagging results
      await this.storeQueryMetadata(query, {
        tagging: result,
        categoryId: category?.id,
      });

      const endTime = performance.now();
      this.logger.log(
        `Tagged query in ${(endTime - startTime).toFixed(2)}ms with ${result.tags.length} tags`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error tagging query: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Store query metadata in the database
   * @param query The search query
   * @param data The metadata to store
   */
  private async storeQueryMetadata(
    query: string,
    data: {
      categorization?: QueryCategorizationResponseDto;
      tagging?: QueryTaggingResponseDto;
      categoryId?: string;
    },
  ): Promise<void> {
    try {
      // Check if we already have this query in the database
      let metadata = await this.queryMetadataRepository.findOne({
        where: {
          query,
          ...(data.categoryId ? { businessCategoryId: data.categoryId } : {}),
        },
      });

      if (!metadata) {
        // Create new metadata entity
        metadata = this.queryMetadataRepository.create({
          query,
          businessCategoryId: data.categoryId,
        });
      }

      // Update with categorization data if provided
      if (data.categorization) {
        metadata.intent = data.categorization.intent;
        metadata.confidence = data.categorization.confidence;
        metadata.topics = data.categorization.topics;
        metadata.entities = data.categorization.entities || [];
      }

      // Update with tagging data if provided
      if (data.tagging) {
        metadata.tags = data.tagging.tags;
        metadata.brandMentions = data.tagging.brandMentions || [];
        metadata.productCategories = data.tagging.productCategories || [];
        metadata.features = data.tagging.features || [];

        // Use type assertion to handle nullable field
        metadata.sentiment = data.tagging.sentiment as number;
      }

      // Save the metadata
      await this.queryMetadataRepository.save(metadata);
      this.logger.debug(`Stored metadata for query: "${query}"`);
    } catch (error) {
      this.logger.error(
        `Error storing query metadata: ${error.message}`,
        error.stack,
      );
      // Don't throw the error, just log it - we don't want to fail the main operation
    }
  }

  /**
   * Build a prompt for query categorization
   * @param query The search query
   * @returns Formatted prompt for the AI model
   */
  private buildCategorizationPrompt(query: string): string {
    return `
Analyze the following search query and categorize it:

Query: "${query}"

Provide a JSON response with the following structure:
{
  "intent": "informational|transactional|navigational|commercial|local",
  "confidence": <number between 0 and 1>,
  "topics": ["topic1", "topic2", ...],
  "entities": ["entity1", "entity2", ...]
}

Where:
- "intent" is the primary intent of the query (informational, transactional, navigational, commercial, or local)
- "confidence" is your confidence in the intent classification (0-1)
- "topics" are the main topics or subjects in the query
- "entities" are specific named entities mentioned (_brands, products, _people, _places)

JSON Response:
`;
  }

  /**
   * Build a prompt for query tagging
   * @param query The search query
   * @param categoryContext Optional category context information
   * @returns Formatted prompt for the AI model
   */
  private buildTaggingPrompt(
    query: string,
    categoryContext: string = '',
  ): string {
    return `
Analyze the following search query and tag it with relevant metadata:

${categoryContext ? categoryContext : ''}
Query: "${query}"

Provide a JSON response with the following structure:
{
  "tags": ["tag1", "tag2", ...],
  "brandMentions": ["brand1", "brand2", ...],
  "productCategories": ["category1", "category2", ...],
  "features": ["feature1", "feature2", ...],
  "sentiment": <number between -1 and 1>
}

Where:
- "tags" are general tags that describe the query content
- "brandMentions" are specific brand names mentioned
- "productCategories" are product categories relevant to the query
- "features" are product features or attributes mentioned
- "sentiment" is the sentiment score (-1 for negative, 0 for _neutral, 1 for _positive)

JSON Response:
`;
  }

  /**
   * Parse the AI response for categorization
   * @param response The AI model response
   * @returns Structured categorization response
   */
  private parseCategorizationResponse(
    response: string,
  ): QueryCategorizationResponseDto {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn(`No JSON found in response: ${response}`);
        throw new Error('Invalid response format');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        this.logger.warn(`Failed to parse JSON: ${jsonMatch[0]}`);
        throw new Error('Invalid JSON format');
      }

      // Check if required fields exist
      if (!parsed.intent) {
        this.logger.warn(
          `Missing intent in parsed response: ${JSON.stringify(parsed)}`,
        );
        throw new Error('Missing intent in response');
      }

      // Validate and normalize the response
      return {
        intent: this.validateIntent(parsed.intent),
        confidence: this.normalizeConfidence(parsed.confidence),
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      };
    } catch (error) {
      this.logger.error(
        `Error parsing categorization response: ${error.message}`,
      );

      // Return a default response if parsing fails
      return {
        intent: QueryIntentType.INFORMATIONAL,
        confidence: 0.5,
        topics: [],
        entities: [],
      };
    }
  }

  /**
   * Parse the AI response for tagging
   * @param response The AI model response
   * @returns Structured tagging response
   */
  private parseTaggingResponse(response: string): QueryTaggingResponseDto {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        this.logger.warn(`No JSON found in tagging response: ${response}`);
        throw new Error('Invalid response format');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        this.logger.warn(`Failed to parse tagging JSON: ${jsonMatch[0]}`);
        throw new Error('Invalid JSON format');
      }

      // Check if required fields exist
      if (!parsed.tags && !Array.isArray(parsed.tags)) {
        this.logger.warn(
          `Missing tags in parsed response: ${JSON.stringify(parsed)}`,
        );
        // Continue with empty tags rather than throwing
      }

      // Validate and normalize the response
      return {
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        brandMentions: Array.isArray(parsed.brandMentions)
          ? parsed.brandMentions
          : [],
        productCategories: Array.isArray(parsed.productCategories)
          ? parsed.productCategories
          : [],
        features: Array.isArray(parsed.features) ? parsed.features : [],
        sentiment:
          typeof parsed.sentiment === 'number'
            ? Math.max(-1, Math.min(1, parsed.sentiment))
            : undefined,
      };
    } catch (error) {
      this.logger.error(`Error parsing tagging response: ${error.message}`);

      // Return a default response if parsing fails
      return {
        tags: [],
        brandMentions: [],
        productCategories: [],
        features: [],
      };
    }
  }

  /**
   * Validate and normalize the intent type
   * @param intent The intent from the AI response
   * @returns Validated intent type
   */
  private validateIntent(intent: string): QueryIntentType {
    if (!intent || typeof intent !== 'string') {
      return QueryIntentType.INFORMATIONAL;
    }

    const normalizedIntent = intent.toLowerCase();

    switch (normalizedIntent) {
      case 'informational':
        return QueryIntentType.INFORMATIONAL;
      case 'transactional':
        return QueryIntentType.TRANSACTIONAL;
      case 'navigational':
        return QueryIntentType.NAVIGATIONAL;
      case 'commercial':
        return QueryIntentType.COMMERCIAL;
      case 'local':
        return QueryIntentType.LOCAL;
      default:
        return QueryIntentType.INFORMATIONAL;
    }
  }

  /**
   * Normalize confidence score to be between 0 and 1
   * @param confidence The confidence score from the AI response
   * @returns Normalized confidence score
   */
  private normalizeConfidence(confidence: any): number {
    if (typeof confidence !== 'number') {
      return 0.5;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}
