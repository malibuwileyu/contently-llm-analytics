import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryCategorizationService } from '../../services/query-categorization.service';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { QueryMetadataEntity } from '../../entities/query-metadata.entity';
import { AIProviderFactoryService } from '../../../ai-provider/services/ai-provider-factory.service';
import { QueryIntentType } from '../../dto/query-categorization.dto';
import {
  AIProviderResponse,
  ProviderType,
} from '../../../ai-provider/interfaces/ai-provider.interface';

describe('QueryCategorizationService', () => {
  let service: QueryCategorizationService;
  let businessCategoryRepository: jest.Mocked<
    Repository<BusinessCategoryEntity>
  >;
  let queryMetadataRepository: jest.Mocked<Repository<QueryMetadataEntity>>;
  let aiProviderFactory: jest.Mocked<AIProviderFactoryService>;
  let mockOpenAIProvider: any;

  // Create partial mocks that satisfy TypeScript but don't need all properties
  const mockBusinessCategory = {
    id: 'category-1',
    name: 'Smartphones',
    keywords: ['phone', 'mobile', 'smartphone'],
    synonyms: ['cell phone', 'mobile phone'],
    parentCategoryId: null,
    description: 'Mobile phones category',
    isActive: true,
    competitors: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    queryTemplates: [],
  } as unknown as BusinessCategoryEntity;

  const mockQueryMetadata = {
    id: 'metadata-1',
    query: 'What are the best smartphones?',
    intent: QueryIntentType.INFORMATIONAL,
    confidence: 0.9,
    topics: ['smartphones', 'best'],
    entities: ['smartphones'],
    tags: ['comparison', 'recommendation'],
    brandMentions: [],
    productCategories: ['smartphones', 'electronics'],
    features: ['quality'],
    sentiment: 0.2,
    businessCategoryId: 'category-1',
    businessCategory: {} as BusinessCategoryEntity,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as QueryMetadataEntity;

  beforeEach(async () => {
    // Create a mock OpenAI provider
    mockOpenAIProvider = {
      complete: jest.fn(),
      type: ProviderType.OPENAI,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryCategorizationService,
        {
          provide: getRepositoryToken(BusinessCategoryEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(QueryMetadataEntity),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: AIProviderFactoryService,
          useValue: {
            getBestProviderByType: jest
              .fn()
              .mockImplementation(() => Promise.resolve(mockOpenAIProvider)),
          },
        },
      ],
    }).compile();

    service = module.get<QueryCategorizationService>(
      QueryCategorizationService,
    );
    businessCategoryRepository = module.get(
      getRepositoryToken(BusinessCategoryEntity),
    ) as jest.Mocked<Repository<BusinessCategoryEntity>>;
    queryMetadataRepository = module.get(
      getRepositoryToken(QueryMetadataEntity),
    ) as jest.Mocked<Repository<QueryMetadataEntity>>;
    aiProviderFactory = module.get(
      AIProviderFactoryService,
    ) as jest.Mocked<AIProviderFactoryService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('categorizeQuery', () => {
    it('should return cached categorization if available', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(mockQueryMetadata);

      // Act
      const result = await service.categorizeQuery(query);

      // Assert
      expect(result).toEqual({
        intent: mockQueryMetadata.intent,
        confidence: mockQueryMetadata.confidence,
        topics: mockQueryMetadata.topics,
        entities: mockQueryMetadata.entities,
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).not.toHaveBeenCalled();
    });

    it('should call OpenAI and store results if no cached data', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(null);

      const mockOpenAIResponse: AIProviderResponse<{ text: string }> = {
        data: {
          text: `
{
  "intent": "informational",
  "confidence": 0.9,
  "topics": ["smartphones", "best"],
  "entities": ["smartphones"]
}
          `,
        },
        metadata: {
          model: 'gpt-4',
          usage: {
            totalTokens: 100,
            promptTokens: 50,
            completionTokens: 50,
          },
          provider: 'openai',
          timestamp: new Date(),
          latencyMs: 500,
        },
      };

      mockOpenAIProvider.complete.mockResolvedValue(mockOpenAIResponse);

      const mockCreatedEntity = {
        ...new QueryMetadataEntity(),
        query,
        intent: QueryIntentType.INFORMATIONAL,
        confidence: 0.9,
        topics: ['smartphones', 'best'],
        entities: ['smartphones'],
      };

      queryMetadataRepository.create.mockReturnValue(
        mockCreatedEntity as QueryMetadataEntity,
      );
      queryMetadataRepository.save.mockResolvedValue(
        mockCreatedEntity as QueryMetadataEntity,
      );

      // Act
      const result = await service.categorizeQuery(query);

      // Assert
      expect(result).toEqual({
        intent: QueryIntentType.INFORMATIONAL,
        confidence: 0.9,
        topics: ['smartphones', 'best'],
        entities: ['smartphones'],
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).toHaveBeenCalledWith(
        ProviderType.OPENAI,
      );
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(queryMetadataRepository.create).toHaveBeenCalled();
      expect(queryMetadataRepository.save).toHaveBeenCalled();
    });

    it('should handle invalid response from OpenAI', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(null);

      const mockOpenAIResponse: AIProviderResponse<{ text: string }> = {
        data: {
          text: 'Invalid JSON',
        },
        metadata: {
          model: 'gpt-4',
          usage: {
            totalTokens: 100,
            promptTokens: 50,
            completionTokens: 50,
          },
          provider: 'openai',
          timestamp: new Date(),
          latencyMs: 500,
        },
      };

      mockOpenAIProvider.complete.mockResolvedValue(mockOpenAIResponse);

      const mockCreatedEntity = {
        ...new QueryMetadataEntity(),
        query,
        intent: QueryIntentType.INFORMATIONAL,
        confidence: 0.5,
        topics: [],
        entities: [],
      };

      queryMetadataRepository.create.mockReturnValue(
        mockCreatedEntity as QueryMetadataEntity,
      );
      queryMetadataRepository.save.mockResolvedValue(
        mockCreatedEntity as QueryMetadataEntity,
      );

      // Act
      const result = await service.categorizeQuery(query);

      // Assert
      expect(result).toEqual({
        intent: QueryIntentType.INFORMATIONAL,
        confidence: 0.5,
        topics: [],
        entities: [],
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).toHaveBeenCalledWith(
        ProviderType.OPENAI,
      );
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(queryMetadataRepository.create).toHaveBeenCalled();
      expect(queryMetadataRepository.save).toHaveBeenCalled();
    });
  });

  describe('tagQuery', () => {
    it('should return cached tagging if available', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(mockQueryMetadata);

      // Act
      const result = await service.tagQuery(query);

      // Assert
      expect(result).toEqual({
        tags: mockQueryMetadata.tags,
        brandMentions: mockQueryMetadata.brandMentions,
        productCategories: mockQueryMetadata.productCategories,
        features: mockQueryMetadata.features,
        sentiment: mockQueryMetadata.sentiment,
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).not.toHaveBeenCalled();
    });

    it('should call OpenAI and store results if no cached data', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(null);
      businessCategoryRepository.findOne.mockResolvedValue(null);

      const mockOpenAIResponse: AIProviderResponse<{ text: string }> = {
        data: {
          text: `
{
  "tags": ["comparison", "recommendation"],
  "brandMentions": ["Apple", "Samsung"],
  "productCategories": ["smartphones", "electronics"],
  "features": ["quality", "price"],
  "sentiment": 0.2
}
          `,
        },
        metadata: {
          model: 'gpt-4',
          usage: {
            totalTokens: 100,
            promptTokens: 50,
            completionTokens: 50,
          },
          provider: 'openai',
          timestamp: new Date(),
          latencyMs: 500,
        },
      };

      mockOpenAIProvider.complete.mockResolvedValue(mockOpenAIResponse);

      const mockCreatedEntity = {
        ...new QueryMetadataEntity(),
        query,
        tags: ['comparison', 'recommendation'],
        brandMentions: ['Apple', 'Samsung'],
        productCategories: ['smartphones', 'electronics'],
        features: ['quality', 'price'],
        sentiment: 0.2,
      };

      queryMetadataRepository.create.mockReturnValue(
        mockCreatedEntity as QueryMetadataEntity,
      );
      queryMetadataRepository.save.mockResolvedValue(
        mockCreatedEntity as QueryMetadataEntity,
      );

      // Act
      const result = await service.tagQuery(query);

      // Assert
      expect(result).toEqual({
        tags: ['comparison', 'recommendation'],
        brandMentions: ['Apple', 'Samsung'],
        productCategories: ['smartphones', 'electronics'],
        features: ['quality', 'price'],
        sentiment: 0.2,
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).toHaveBeenCalledWith(
        ProviderType.OPENAI,
      );
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(queryMetadataRepository.create).toHaveBeenCalled();
      expect(queryMetadataRepository.save).toHaveBeenCalled();
    });

    it('should handle invalid response from OpenAI', async () => {
      // Arrange
      const query = 'What are the best smartphones?';
      queryMetadataRepository.findOne.mockResolvedValue(null);
      businessCategoryRepository.findOne.mockResolvedValue(null);

      const mockOpenAIResponse: AIProviderResponse<{ text: string }> = {
        data: {
          text: 'Invalid JSON',
        },
        metadata: {
          model: 'gpt-4',
          usage: {
            totalTokens: 100,
            promptTokens: 50,
            completionTokens: 50,
          },
          provider: 'openai',
          timestamp: new Date(),
          latencyMs: 500,
        },
      };

      mockOpenAIProvider.complete.mockResolvedValue(mockOpenAIResponse);

      const mockCreatedEntity = {
        ...new QueryMetadataEntity(),
        query,
        tags: [],
        brandMentions: [],
        productCategories: [],
        features: [],
      };

      queryMetadataRepository.create.mockReturnValue(
        mockCreatedEntity as QueryMetadataEntity,
      );
      queryMetadataRepository.save.mockResolvedValue(
        mockCreatedEntity as QueryMetadataEntity,
      );

      // Act
      const result = await service.tagQuery(query);

      // Assert
      expect(result).toEqual({
        tags: [],
        brandMentions: [],
        productCategories: [],
        features: [],
      });
      expect(queryMetadataRepository.findOne).toHaveBeenCalledWith({
        where: { query },
      });
      expect(aiProviderFactory.getBestProviderByType).toHaveBeenCalledWith(
        ProviderType.OPENAI,
      );
      expect(mockOpenAIProvider.complete).toHaveBeenCalled();
      expect(queryMetadataRepository.create).toHaveBeenCalled();
      expect(queryMetadataRepository.save).toHaveBeenCalled();
    });
  });
});
