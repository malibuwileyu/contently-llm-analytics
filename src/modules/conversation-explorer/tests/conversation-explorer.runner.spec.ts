import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MockConversationExplorerRunner } from './mocks/conversation-explorer.runner.mock';

// Define the DTO types
interface AnalyzeConversationDto {
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
}

interface TrendOptionsDto {
  startDate?: Date;
  endDate?: Date;
}

describe('ConversationExplorerRunner', () => {
  let runner: MockConversationExplorerRunner;
  let mockDataSource: any;
  let mockCacheService: any;
  let mockMetricsService: any;

  const mockBrandId = uuidv4();
  const mockNlpServiceUrl = 'http://nlp-service.example.com';
  const mockSearchServiceUrl = 'http://search-service.example.com';

  const mockConversation = {
    id: uuidv4(),
    brandId: mockBrandId,
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
    insights: [
      {
        id: uuidv4(),
        type: 'intent',
        category: 'account_inquiry',
        confidence: 0.85,
        details: { relevance: 0.9 },
      },
      {
        id: uuidv4(),
        type: 'sentiment',
        category: 'positive',
        confidence: 0.75,
        details: { score: 0.75 },
      },
    ],
    engagementScore: 0.75,
    analyzedAt: new Date(),
  };

  const mockTrends = {
    topIntents: [
      { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
      { category: 'billing_question', count: 5, averageConfidence: 0.75 },
    ],
    topTopics: [
      { name: 'account', count: 8, averageRelevance: 0.8 },
      { name: 'billing', count: 6, averageRelevance: 0.7 },
    ],
    engagementTrends: [
      { date: new Date('2023-01-05'), averageEngagement: 0.65 },
      { date: new Date('2023-01-12'), averageEngagement: 0.72 },
    ],
    commonActions: [
      { type: 'request_info', count: 12, averageConfidence: 0.82 },
      { type: 'submit_form', count: 8, averageConfidence: 0.78 },
    ],
  };

  beforeEach(() => {
    // Create mock data source
    mockDataSource = {
      createEntityManager: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
      getRepository: jest.fn().mockReturnValue({
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      }),
    };

    // Create mock cache service
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };

    // Create mock metrics service
    mockMetricsService = {
      recordAnalysisDuration: jest.fn(),
      incrementErrorCount: jest.fn(),
    };

    // Create runner instance
    runner = new MockConversationExplorerRunner(
      mockDataSource,
      mockNlpServiceUrl,
      mockSearchServiceUrl,
      mockCacheService,
      mockMetricsService
    );
    
    // Spy on runner methods
    jest.spyOn(runner, 'analyzeConversation');
    jest.spyOn(runner, 'getConversationTrends');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(runner).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze a conversation and return insights', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        brandId: mockBrandId,
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
      };

      // Act
      const result = await runner.analyzeConversation(input);

      // Assert
      expect(runner.analyzeConversation).toHaveBeenCalledWith(input);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('brandId', input.brandId);
      expect(result).toHaveProperty('messages', input.messages);
      expect(result).toHaveProperty('metadata', input.metadata);
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('engagementScore');
      expect(result).toHaveProperty('analyzedAt');
    });

    it('should handle errors during analysis', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        brandId: mockBrandId,
        messages: [
          {
            role: 'user',
            content: 'Hello',
            timestamp: new Date(),
          },
        ],
        metadata: {
          platform: 'web',
          context: 'support',
          tags: [],
        },
      };

      const error = new Error('Analysis failed');
      jest.spyOn(runner, 'analyzeConversation').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(runner.analyzeConversation(input)).rejects.toThrow(error);
      expect(runner.analyzeConversation).toHaveBeenCalledWith(input);
    });
  });

  describe('getConversationTrends', () => {
    it('should get conversation trends', async () => {
      // Arrange
      const brandId = mockBrandId;
      const options: TrendOptionsDto = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      // Act
      const result = await runner.getConversationTrends(brandId, options);

      // Assert
      expect(runner.getConversationTrends).toHaveBeenCalledWith(brandId, options);
      expect(result).toHaveProperty('topIntents');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('commonActions');
    });

    it('should handle errors when getting trends', async () => {
      // Arrange
      const brandId = mockBrandId;
      const options: TrendOptionsDto = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      const error = new Error('Failed to get trends');
      jest.spyOn(runner, 'getConversationTrends').mockRejectedValueOnce(error);

      // Act & Assert
      await expect(runner.getConversationTrends(brandId, options)).rejects.toThrow(error);
      expect(runner.getConversationTrends).toHaveBeenCalledWith(brandId, options);
    });
  });
}); 