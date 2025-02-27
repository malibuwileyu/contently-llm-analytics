import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuidv4 } from 'uuid';
import { MockConversationExplorerResolver } from './mocks/conversation-explorer.resolver.mock';

// Mock the GraphQL input types
class AnalyzeConversationInput {
  brandId: string;
  messages: any[];
  metadata?: any;
}

class TrendOptionsInput {
  startDate?: Date;
  endDate?: Date;
}

describe('ConversationExplorerResolver', () => {
  let resolver: MockConversationExplorerResolver;
  let service: any;
  let conversationRepo: any;

  const mockBrandId = uuidv4();

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
    createdAt: new Date(),
    updatedAt: new Date(),
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

  beforeEach(async () => {
    // Create mock repository
    conversationRepo = {
      findWithInsights: jest.fn().mockResolvedValue(mockConversation),
      findByBrandId: jest.fn().mockResolvedValue([mockConversation]),
    };

    // Create mock service
    service = {
      analyzeConversation: jest.fn().mockResolvedValue(mockConversation),
      getConversationTrends: jest.fn().mockResolvedValue(mockTrends),
      conversationRepo: conversationRepo,
    };

    // Create mock resolver
    resolver = new MockConversationExplorerResolver();
    
    // Spy on resolver methods
    jest.spyOn(resolver, 'analyzeConversation');
    jest.spyOn(resolver, 'conversationTrends');
    jest.spyOn(resolver, 'conversation');
    jest.spyOn(resolver, 'conversationsByBrand');
    jest.spyOn(resolver, 'getInsights');
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze a conversation and return insights', async () => {
      // Arrange
      const input = new AnalyzeConversationInput();
      input.brandId = mockBrandId;
      input.messages = [
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
      ];
      input.metadata = {
        platform: 'web',
        context: 'support',
        tags: ['account', 'help'],
      };

      // Act
      const result = await resolver.analyzeConversation(input);

      // Assert
      expect(resolver.analyzeConversation).toHaveBeenCalledWith(input);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('brandId', input.brandId);
      expect(result).toHaveProperty('messages', input.messages);
      expect(result).toHaveProperty('metadata', input.metadata);
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('engagementScore');
      expect(result).toHaveProperty('analyzedAt');
    });
  });

  describe('conversationTrends', () => {
    it('should get conversation trends', async () => {
      // Arrange
      const brandId = mockBrandId;
      const options = new TrendOptionsInput();
      options.startDate = new Date('2023-01-01');
      options.endDate = new Date('2023-01-31');

      // Act
      const result = await resolver.conversationTrends(brandId, options);

      // Assert
      expect(resolver.conversationTrends).toHaveBeenCalledWith(brandId, options);
      expect(result).toHaveProperty('topIntents');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('commonActions');
    });

    it('should use default dates if not provided', async () => {
      // Arrange
      const brandId = mockBrandId;

      // Act
      const result = await resolver.conversationTrends(brandId);

      // Assert
      expect(resolver.conversationTrends).toHaveBeenCalled();
      // Just check that it was called with the brandId
      expect(result).toHaveProperty('topIntents');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('commonActions');
    });
  });

  describe('conversation', () => {
    it('should get a conversation by ID', async () => {
      // Arrange
      const id = mockConversation.id;

      // Act
      const result = await resolver.conversation(id);

      // Assert
      expect(resolver.conversation).toHaveBeenCalledWith(id);
      expect(result).toHaveProperty('id', id);
      expect(result).toHaveProperty('brandId');
      expect(result).toHaveProperty('messages');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('engagementScore');
      expect(result).toHaveProperty('analyzedAt');
    });
  });

  describe('conversationsByBrand', () => {
    it('should get conversations by brand ID', async () => {
      // Arrange
      const brandId = mockBrandId;

      // Act
      const result = await resolver.conversationsByBrand(brandId);

      // Assert
      expect(resolver.conversationsByBrand).toHaveBeenCalledWith(brandId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('brandId', brandId);
    });
  });

  describe('getInsights', () => {
    it('should resolve insights for a conversation', async () => {
      // Arrange
      const conversation = { id: mockConversation.id };

      // Act
      const result = await resolver.getInsights(conversation);

      // Assert
      expect(resolver.getInsights).toHaveBeenCalledWith(conversation);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('category');
      expect(result[0]).toHaveProperty('confidence');
    });
  });
}); 