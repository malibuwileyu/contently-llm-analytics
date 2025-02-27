import { Test, TestingModule } from '@nestjs/testing';
import { ConversationExplorerController } from '../controllers/conversation-explorer.controller';
import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { v4 as uuidv4 } from 'uuid';
import { AnalyzeConversationDto, TrendOptionsDto } from '../dto/analyze-conversation.dto';

// Mock the JwtAuthGuard
jest.mock('../../../auth/guards/jwt-auth.guard', () => {
  return {
    JwtAuthGuard: jest.fn().mockImplementation(() => ({
      canActivate: jest.fn().mockReturnValue(true),
    })),
  };
});

describe('ConversationExplorerController', () => {
  let controller: ConversationExplorerController;
  let service: ConversationExplorerService;
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
    };

    // Create mock service
    const mockService = {
      analyzeConversation: jest.fn().mockResolvedValue(mockConversation),
      getConversationTrends: jest.fn().mockResolvedValue(mockTrends),
      conversationRepo: conversationRepo,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationExplorerController],
      providers: [
        {
          provide: ConversationExplorerService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ConversationExplorerController>(ConversationExplorerController);
    service = module.get<ConversationExplorerService>(ConversationExplorerService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze a conversation and return insights', async () => {
      // Arrange
      const dto: AnalyzeConversationDto = {
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
      
      (service.analyzeConversation as jest.Mock).mockResolvedValue(mockConversation);

      // Act
      const result = await controller.analyzeConversation(dto);

      // Assert
      expect(service.analyzeConversation).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        id: mockConversation.id,
        brandId: mockConversation.brandId,
        messages: mockConversation.messages,
        metadata: mockConversation.metadata,
        insights: mockConversation.insights,
        engagementScore: mockConversation.engagementScore,
        analyzedAt: mockConversation.analyzedAt,
      });
    });

    it('should handle errors during analysis', async () => {
      // Arrange
      const dto: AnalyzeConversationDto = {
        brandId: uuidv4(),
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
      (service.analyzeConversation as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(controller.analyzeConversation(dto)).rejects.toThrow(error);
      expect(service.analyzeConversation).toHaveBeenCalledWith(dto);
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
      
      (service.getConversationTrends as jest.Mock).mockResolvedValue(mockTrends);

      // Act
      const result = await controller.getConversationTrends(brandId, options);

      // Assert
      expect(service.getConversationTrends).toHaveBeenCalledWith(brandId, {
        startDate: options.startDate,
        endDate: options.endDate,
      });
      expect(result).toEqual({
        topIntents: mockTrends.topIntents,
        topTopics: mockTrends.topTopics,
        engagementTrend: mockTrends.engagementTrends,
        commonActions: mockTrends.commonActions,
      });
    });

    it('should use default dates if not provided', async () => {
      // Arrange
      const brandId = mockBrandId;
      const options: TrendOptionsDto = {};
      
      (service.getConversationTrends as jest.Mock).mockResolvedValue(mockTrends);

      // Act
      const result = await controller.getConversationTrends(brandId, options);

      // Assert
      expect(service.getConversationTrends).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
      expect(result).toEqual({
        topIntents: mockTrends.topIntents,
        topTopics: mockTrends.topTopics,
        engagementTrend: mockTrends.engagementTrends,
        commonActions: mockTrends.commonActions,
      });
    });
  });

  describe('getConversation', () => {
    it('should get a conversation by ID', async () => {
      // Arrange
      const id = mockConversation.id;
      conversationRepo.findWithInsights.mockResolvedValue(mockConversation);

      // Act
      const result = await controller.getConversation(id);

      // Assert
      expect(conversationRepo.findWithInsights).toHaveBeenCalledWith(id);
      expect(result).toEqual({
        id: mockConversation.id,
        brandId: mockConversation.brandId,
        messages: mockConversation.messages,
        metadata: mockConversation.metadata,
        insights: mockConversation.insights,
        engagementScore: mockConversation.engagementScore,
        analyzedAt: mockConversation.analyzedAt,
      });
    });
  });
}); 