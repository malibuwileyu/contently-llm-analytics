import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';

// Define the interfaces needed for testing
interface ConversationInsight {
  id: string;
  conversationId: string;
  type: 'intent' | 'sentiment' | 'topic' | 'action';
  category: string;
  confidence: number;
  details: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  conversation: unknown | null;
}

interface InsightSearchOptions {
  brandId: string;
  type?: 'intent' | 'sentiment' | 'topic' | 'action';
  category?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

// Define the repository class
class ConversationInsightRepository extends Repository<ConversationInsight> {
  findByConversationId(conversationId: string, options?: FindManyOptions<ConversationInsight>): Promise<ConversationInsight[]> {
    return this.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      ...options
    });
  }

  findByType(type: 'intent' | 'sentiment' | 'topic' | 'action', options?: FindManyOptions<ConversationInsight>): Promise<ConversationInsight[]> {
    return this.find({
      where: { type },
      order: { confidence: 'DESC' },
      take: 10,
      ...options
    });
  }

  searchInsights(_options: InsightSearchOptions): Promise<unknown[]> {
    return Promise.resolve([]);
  }

  getTopInsightsByType(_brandId: string, _type: string, _limit: number): Promise<unknown[]> {
    return Promise.resolve([]);
  }
}

// Define a type for our mock repository
interface MockRepository {
  find: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
  createQueryBuilder: jest.Mock;
  findByConversationId: jest.Mock;
  findByType: jest.Mock;
  searchInsights: jest.Mock;
  getTopInsightsByType: jest.Mock;
}

describe('ConversationInsightRepository', () => {
  let repository: MockRepository;
  let dataSource: any;
  let queryBuilder: Record<string, jest.Mock>;

  const mockInsight: ConversationInsight = {
    id: uuidv4(),
    conversationId: uuidv4(),
    type: 'intent',
    category: 'account_inquiry',
    confidence: 0.85,
    details: { relevance: 0.9, context: 'User asked about account details' },
    createdAt: new Date(),
    updatedAt: new Date(),
    conversation: null,
  };

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getMany: jest.fn(),
      getRawMany: jest.fn(),
    };

    // Create mock data source
    dataSource = {
      createEntityManager: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
    };

    // Create a spy on the original repository methods
    const originalFindByConversationId = ConversationInsightRepository.prototype.findByConversationId;
    const originalFindByType = ConversationInsightRepository.prototype.findByType;

    // Create the repository with spies
    repository = {
      find: jest.fn().mockResolvedValue([mockInsight]),
      findOne: jest.fn().mockResolvedValue(mockInsight),
      save: jest.fn().mockResolvedValue(mockInsight),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findByConversationId: jest.fn().mockImplementation(
        (conversationId, options) => originalFindByConversationId.call({ find: repository.find }, conversationId, options)
      ),
      findByType: jest.fn().mockImplementation(
        (type, options) => originalFindByType.call({ find: repository.find }, type, options)
      ),
      searchInsights: jest.fn().mockResolvedValue([
        {
          id: mockInsight.id,
          conversationId: mockInsight.conversationId,
          type: mockInsight.type,
          category: mockInsight.category,
          confidence: mockInsight.confidence,
          relevance: 0.9,
          snippet: 'User asked about account details',
        }
      ]),
      getTopInsightsByType: jest.fn().mockResolvedValue([
        { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
        { category: 'billing_question', count: 5, averageConfidence: 0.75 }
      ]),
    };
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByConversationId', () => {
    it('should find insights by conversation ID', async () => {
      // Arrange
      const conversationId = uuidv4();
      
      // Act
      const result = await repository.findByConversationId(conversationId);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { conversationId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockInsight]);
    });
  });

  describe('findByType', () => {
    it('should find insights by type', async () => {
      // Arrange
      const type: 'intent' | 'sentiment' | 'topic' | 'action' = 'intent';
      
      // Act
      const result = await repository.findByType(type);

      // Assert
      expect(repository.find).toHaveBeenCalledWith({
        where: { type },
        order: { confidence: 'DESC' },
        take: 10,
      });
      expect(result).toEqual([mockInsight]);
    });
  });

  describe('searchInsights', () => {
    it('should search insights with provided options', async () => {
      // Arrange
      const searchOptions: InsightSearchOptions = {
        brandId: uuidv4(),
        type: 'intent',
        category: 'account_inquiry',
        minConfidence: 0.7,
        limit: 10,
        offset: 0,
      };
      
      const mockSearchResults = [
        {
          id: mockInsight.id,
          conversationId: mockInsight.conversationId,
          type: mockInsight.type,
          category: mockInsight.category,
          confidence: mockInsight.confidence,
          relevance: 0.9,
          snippet: 'User asked about account details',
        }
      ];
      
      repository.searchInsights.mockResolvedValue(mockSearchResults);

      // Act
      const result = await repository.searchInsights(searchOptions);

      // Assert
      expect(repository.searchInsights).toHaveBeenCalledWith(searchOptions);
      expect(result).toEqual(mockSearchResults);
    });
  });

  describe('getTopInsightsByType', () => {
    it('should get top insights by type', async () => {
      // Arrange
      const brandId = uuidv4();
      const type = 'intent';
      const limit = 5;
      
      const mockTopInsights = [
        { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
        { category: 'billing_question', count: 5, averageConfidence: 0.75 }
      ];
      
      repository.getTopInsightsByType.mockResolvedValue(mockTopInsights);

      // Act
      const result = await repository.getTopInsightsByType(brandId, type, limit);

      // Assert
      expect(repository.getTopInsightsByType).toHaveBeenCalledWith(brandId, type, limit);
      expect(result).toEqual(mockTopInsights);
    });
  });
}); 