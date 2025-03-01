import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryGeneratorService } from '../../services/query-generator.service';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { Logger } from '@nestjs/common';
import { BatchQueryGenerationDto } from '../../dto/batch-query-generation.dto';

describe('QueryGeneratorService', () => {
  let service: QueryGeneratorService;
  let businessCategoryRepository: Repository<BusinessCategoryEntity>;
  let competitorRepository: Repository<CompetitorEntity>;

  // Create mock objects using Partial<T> to avoid type errors
  const mockBusinessCategory: Partial<BusinessCategoryEntity> = {
    id: 'category-1',
    name: 'Smartphones',
    description: 'Mobile phones with advanced features',
    parentCategoryId: undefined,
    keywords: ['phone', 'mobile', 'smart device'],
    synonyms: ['cell phone', 'mobile phone'],
    isActive: true,
    competitors: [],
    queryTemplates: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCompetitors: Partial<CompetitorEntity>[] = [
    {
      id: 'comp-1',
      name: 'Apple',
      website: 'https://apple.com',
      description: 'iPhone manufacturer',
      alternateNames: ['Apple Inc.'],
      keywords: ['iphone', 'ios'],
      products: ['iPhone', 'iPad'],
      isActive: true,
      isCustomer: true,
      businessCategoryId: 'category-1',
      mentions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'comp-2',
      name: 'Samsung',
      website: 'https://samsung.com',
      description: 'Galaxy manufacturer',
      alternateNames: ['Samsung Electronics'],
      keywords: ['galaxy', 'android'],
      products: ['Galaxy S', 'Galaxy Note'],
      isActive: true,
      isCustomer: false,
      businessCategoryId: 'category-1',
      mentions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'comp-3',
      name: 'Google',
      website: 'https://google.com',
      description: 'Pixel manufacturer',
      alternateNames: ['Google LLC'],
      keywords: ['pixel', 'android'],
      products: ['Pixel', 'Nexus'],
      isActive: true,
      isCustomer: false,
      businessCategoryId: 'category-1',
      mentions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueryGeneratorService,
        {
          provide: getRepositoryToken(BusinessCategoryEntity),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CompetitorEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            _warn: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QueryGeneratorService>(QueryGeneratorService);
    businessCategoryRepository = module.get<Repository<BusinessCategoryEntity>>(
      getRepositoryToken(BusinessCategoryEntity),
    );
    competitorRepository = module.get<Repository<CompetitorEntity>>(
      getRepositoryToken(CompetitorEntity),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQueriesForCategory', () => {
    it('should generate queries for a valid category', async () => {
      // Arrange
      jest
        .spyOn(businessCategoryRepository, 'findOne')
        .mockResolvedValue(mockBusinessCategory as BusinessCategoryEntity);
      jest
        .spyOn(competitorRepository, 'find')
        .mockResolvedValue(mockCompetitors as CompetitorEntity[]);

      // Act
      const result = await service.generateQueriesForCategory('category-1', 5);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(businessCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
      expect(competitorRepository.find).toHaveBeenCalledWith({
        where: { businessCategoryId: 'category-1' },
      });
    });

    it('should throw an error if category is not found', async () => {
      // Arrange
      jest.spyOn(businessCategoryRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateQueriesForCategory('invalid-id'),
      ).rejects.toThrow('Business category with ID invalid-id not found');
    });
  });

  describe('generateQueriesForCustomer', () => {
    it('should generate queries for a valid customer', async () => {
      // Arrange
      const customerCompetitor = mockCompetitors[0]; // Apple (_isCustomer: true)
      jest
        .spyOn(competitorRepository, 'findOne')
        .mockResolvedValue(customerCompetitor as CompetitorEntity);
      jest
        .spyOn(businessCategoryRepository, 'findOne')
        .mockResolvedValue(mockBusinessCategory as BusinessCategoryEntity);
      jest
        .spyOn(competitorRepository, 'find')
        .mockResolvedValue(mockCompetitors as CompetitorEntity[]);

      // Act
      const result = await service.generateQueriesForCustomer('comp-1', 5);

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(competitorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comp-1', isCustomer: true },
      });
      expect(businessCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
      expect(competitorRepository.find).toHaveBeenCalledWith({
        where: { businessCategoryId: 'category-1' },
      });
    });

    it('should throw an error if customer is not found', async () => {
      // Arrange
      jest.spyOn(competitorRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateQueriesForCustomer('invalid-id'),
      ).rejects.toThrow('Customer competitor with ID invalid-id not found');
    });

    it('should throw an error if category is not found', async () => {
      // Arrange
      const customerCompetitor = mockCompetitors[0]; // Apple (_isCustomer: true)
      jest
        .spyOn(competitorRepository, 'findOne')
        .mockResolvedValue(customerCompetitor as CompetitorEntity);
      jest.spyOn(businessCategoryRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateQueriesForCustomer('comp-1'),
      ).rejects.toThrow('Business category with ID category-1 not found');
    });
  });

  describe('generateComparisonQueries', () => {
    it('should generate comparison queries for valid competitors', async () => {
      // Arrange
      const competitor1 = mockCompetitors[0]; // Apple
      const competitor2 = mockCompetitors[1]; // Samsung

      jest
        .spyOn(competitorRepository, 'findOne')
        .mockResolvedValueOnce(competitor1 as CompetitorEntity)
        .mockResolvedValueOnce(competitor2 as CompetitorEntity);

      jest
        .spyOn(businessCategoryRepository, 'findOne')
        .mockResolvedValue(mockBusinessCategory as BusinessCategoryEntity);

      // Act
      const result = await service.generateComparisonQueries(
        'comp-1',
        'comp-2',
        5,
      );

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(5);
      expect(competitorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comp-1' },
      });
      expect(competitorRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'comp-2' },
      });
      expect(businessCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
    });

    it('should throw an error if first competitor is not found', async () => {
      // Arrange
      jest.spyOn(competitorRepository, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.generateComparisonQueries('invalid-id', 'comp-2'),
      ).rejects.toThrow('Competitor with ID invalid-id not found');
    });

    it('should throw an error if second competitor is not found', async () => {
      // Arrange
      const competitor1 = mockCompetitors[0]; // Apple

      jest
        .spyOn(competitorRepository, 'findOne')
        .mockResolvedValueOnce(competitor1 as CompetitorEntity)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        service.generateComparisonQueries('comp-1', 'invalid-id'),
      ).rejects.toThrow('Competitor with ID invalid-id not found');
    });

    it('should throw an error if competitors are in different categories', async () => {
      // Arrange
      const competitor1 = mockCompetitors[0]; // Apple
      const competitor2 = {
        ...mockCompetitors[1],
        businessCategoryId: 'different-category',
      }; // Samsung with different category

      jest
        .spyOn(competitorRepository, 'findOne')
        .mockResolvedValueOnce(competitor1 as CompetitorEntity)
        .mockResolvedValueOnce(competitor2 as CompetitorEntity);

      // Act & Assert
      await expect(
        service.generateComparisonQueries('comp-1', 'comp-2'),
      ).rejects.toThrow(
        'Competitors must be in the same business category for comparison',
      );
    });
  });

  describe('generateQueriesBatch', () => {
    it('should generate queries for multiple categories, customers, and comparisons', async () => {
      // Mock the individual query generation methods
      jest
        .spyOn(service, 'generateQueriesForCategory')
        .mockResolvedValueOnce(['category query 1', 'category query 2']);
      jest
        .spyOn(service, 'generateQueriesForCustomer')
        .mockResolvedValueOnce(['customer query 1', 'customer query 2']);
      jest
        .spyOn(service, 'generateComparisonQueries')
        .mockResolvedValueOnce(['comparison query 1', 'comparison query 2']);

      const batchDto: BatchQueryGenerationDto = {
        categories: [{ _categoryId: 'category-id', limit: 2 }],
        customers: [{ _customerId: 'customer-id', limit: 2 }],
        comparisons: [
          {
            _competitor1Id: 'competitor1-id',
            _competitor2Id: 'competitor2-id',
            limit: 2,
          },
        ],
      };

      const result = await service.generateQueriesBatch(batchDto);

      expect(result.results).toHaveLength(3);

      // Check category result
      expect(result.results[0]).toEqual({
        type: 'category',
        _ids: ['category-id'],
        queries: ['category query 1', 'category query 2'],
      });

      // Check customer result
      expect(result.results[1]).toEqual({
        type: 'customer',
        _ids: ['customer-id'],
        queries: ['customer query 1', 'customer query 2'],
      });

      // Check comparison result
      expect(result.results[2]).toEqual({
        type: 'comparison',
        _ids: ['competitor1-id', 'competitor2-id'],
        queries: ['comparison query 1', 'comparison query 2'],
      });

      expect(service.generateQueriesForCategory).toHaveBeenCalledWith(
        'category-id',
        2,
      );
      expect(service.generateQueriesForCustomer).toHaveBeenCalledWith(
        'customer-id',
        2,
      );
      expect(service.generateComparisonQueries).toHaveBeenCalledWith(
        'competitor1-id',
        'competitor2-id',
        2,
      );
    });

    it('should handle errors in individual query generation', async () => {
      // Mock success and failure scenarios
      jest
        .spyOn(service, 'generateQueriesForCategory')
        .mockResolvedValueOnce(['category query 1', 'category query 2']);
      jest
        .spyOn(service, 'generateQueriesForCustomer')
        .mockRejectedValueOnce(new Error('Customer not found'));
      jest
        .spyOn(service, 'generateComparisonQueries')
        .mockResolvedValueOnce(['comparison query 1', 'comparison query 2']);

      const batchDto: BatchQueryGenerationDto = {
        categories: [{ _categoryId: 'category-id', limit: 2 }],
        customers: [{ _customerId: 'invalid-id', limit: 2 }],
        comparisons: [
          {
            _competitor1Id: 'competitor1-id',
            _competitor2Id: 'competitor2-id',
            limit: 2,
          },
        ],
      };

      const result = await service.generateQueriesBatch(batchDto);

      expect(result.results).toHaveLength(3);

      // Check category result (success)
      expect(result.results[0]).toEqual({
        type: 'category',
        _ids: ['category-id'],
        queries: ['category query 1', 'category query 2'],
      });

      // Check customer result (failure)
      expect(result.results[1]).toEqual({
        type: 'customer',
        _ids: ['invalid-id'],
        queries: [],
        error: 'Customer not found',
      });

      // Check comparison result (success)
      expect(result.results[2]).toEqual({
        type: 'comparison',
        _ids: ['competitor1-id', 'competitor2-id'],
        queries: ['comparison query 1', 'comparison query 2'],
      });
    });

    it('should handle empty batch requests', async () => {
      const batchDto: BatchQueryGenerationDto = {};

      const result = await service.generateQueriesBatch(batchDto);

      expect(result.results).toHaveLength(0);
      // Don't check if methods were called since they're not mocked in this test
    });
  });

  describe('validateQuery', () => {
    it('should validate a good query with high score', async () => {
      // Arrange
      const goodQuery =
        'What are the best smartphones for photography in 2024?';

      // Act
      const result = await service.validateQuery(goodQuery);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(0.8);
      expect(result.issues).toBeDefined();
      expect(result.issues?.length).toBe(0);
    });

    it('should mark a short query as invalid', async () => {
      // Arrange
      const shortQuery = 'phones';

      // Act
      const result = await service.validateQuery(shortQuery);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(0.8);
      expect(result.issues).toBeDefined();
      expect(result.issues?.includes('Query is too short')).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(result.suggestions?.length).toBeGreaterThan(0);
    });

    it('should suggest formatting as a question', async () => {
      // Arrange
      const nonQuestionQuery = 'best smartphones for photography';

      // Act
      const result = await service.validateQuery(nonQuestionQuery);

      // Assert
      expect(result.suggestions).toBeDefined();
      expect(
        result.suggestions?.includes(
          'Format your query as a question for better results',
        ),
      ).toBe(true);
    });

    it('should mark a query with only common words as invalid', async () => {
      // Arrange
      const commonWordsQuery = 'the and but';

      // Act
      const result = await service.validateQuery(commonWordsQuery);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.issues).toBeDefined();
      expect(result.issues?.includes('Query contains only common words')).toBe(
        true,
      );
    });

    it('should suggest adding specific terms for generic queries', async () => {
      // Arrange
      const genericQuery = 'How do I find a good one?';

      // Act
      const result = await service.validateQuery(genericQuery);

      // Assert
      expect(result.issues).toBeDefined();
      expect(result.issues?.includes('Query lacks specificity')).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(
        result.suggestions?.includes(
          'Include specific brands, products, or features in your query',
        ),
      ).toBe(true);
    });
  });
});
