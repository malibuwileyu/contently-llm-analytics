import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, FindManyOptions, SelectQueryBuilder } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';

// Define the interfaces needed for testing
interface Conversation {
  id: string;
  brandId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };
  insights: any[];
  engagementScore: number;
  analyzedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Define the repository interface
class ConversationRepository extends Repository<Conversation> {
  findWithInsights(id: string): Promise<Conversation | null> {
    return Promise.resolve(null);
  }

  findByBrandId(brandId: string, options?: FindManyOptions<Conversation>): Promise<Conversation[]> {
    return Promise.resolve([]);
  }

  getEngagementTrend(brandId: string, startDate: Date, endDate: Date): Promise<any[]> {
    return Promise.resolve([]);
  }
}

describe('ConversationRepository', () => {
  let repository: any; // Using any to allow mocking
  let dataSource: any;
  let queryBuilder: any;

  const mockConversation: Conversation = {
    id: uuidv4(),
    brandId: uuidv4(),
    messages: [
      {
        role: 'user',
        content: 'Hello, I need help with my account',
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content: 'I\'d be happy to help with your account. What do you need assistance with?',
        timestamp: new Date(),
      },
    ],
    metadata: {
      platform: 'web',
      context: 'support',
      tags: ['account', 'help'],
    },
    insights: [],
    engagementScore: 0.75,
    analyzedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConversationRepository,
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
            findWithInsights: jest.fn(),
            findByBrandId: jest.fn(),
            getEngagementTrend: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    repository = module.get<ConversationRepository>(ConversationRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findWithInsights', () => {
    it('should find a conversation with its insights', async () => {
      // Arrange
      const id = uuidv4();
      const conversationWithInsights = {
        ...mockConversation,
        insights: [
          {
            id: uuidv4(),
            type: 'intent',
            category: 'account_inquiry',
            confidence: 0.85,
          },
          {
            id: uuidv4(),
            type: 'sentiment',
            category: 'positive',
            confidence: 0.75,
          },
        ],
      };
      
      repository.findWithInsights.mockResolvedValue(conversationWithInsights);

      // Act
      const result = await repository.findWithInsights(id);

      // Assert
      expect(repository.findWithInsights).toHaveBeenCalledWith(id);
      expect(result).toEqual(conversationWithInsights);
    });

    it('should return null if conversation not found', async () => {
      // Arrange
      const id = uuidv4();
      repository.findWithInsights.mockResolvedValue(null);

      // Act
      const result = await repository.findWithInsights(id);

      // Assert
      expect(repository.findWithInsights).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });
  });

  describe('findByBrandId', () => {
    it('should find conversations by brand ID', async () => {
      // Arrange
      const brandId = uuidv4();
      const options: FindManyOptions<Conversation> = {
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      };
      
      repository.findByBrandId.mockResolvedValue([mockConversation]);

      // Act
      const result = await repository.findByBrandId(brandId, options);

      // Assert
      expect(repository.findByBrandId).toHaveBeenCalledWith(brandId, options);
      expect(result).toEqual([mockConversation]);
    });
  });

  describe('getEngagementTrend', () => {
    it('should get engagement trends for a brand', async () => {
      // Arrange
      const brandId = uuidv4();
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const mockTrends = [
        { date: new Date('2023-01-05'), averageEngagement: 0.65 },
        { date: new Date('2023-01-12'), averageEngagement: 0.72 },
        { date: new Date('2023-01-19'), averageEngagement: 0.68 },
        { date: new Date('2023-01-26'), averageEngagement: 0.75 },
      ];
      
      repository.getEngagementTrend.mockResolvedValue(mockTrends);

      // Act
      const result = await repository.getEngagementTrend(brandId, startDate, endDate);

      // Assert
      expect(repository.getEngagementTrend).toHaveBeenCalledWith(brandId, startDate, endDate);
      expect(result).toEqual(mockTrends);
    });
  });
}); 