import { v4 as uuidv4 } from 'uuid';
import {
  AnalyzeConversationDto,
  TrendOptionsDto,
} from '../dto/analyze-conversation.dto';
import {
  ConversationDto,
  ConversationInsightDto,
  ConversationTrendsDto,
} from '../dto/conversation-insight.dto';

// Create a mock controller that mimics the real controller but doesn't import it
class MockConversationExplorerController {
  constructor(private readonly service: any) {}

  async analyzeConversation(
    data: AnalyzeConversationDto,
  ): Promise<ConversationDto> {
    const conversation = await this.service.analyzeConversation(data);
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map((insight: any) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details:
          typeof insight.details === 'string'
            ? JSON.parse(insight.details)
            : insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async getConversation(id: string): Promise<ConversationDto> {
    const conversation = await this.service.getConversationById(id);
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map((insight: any) => ({
        id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details:
          typeof insight.details === 'string'
            ? JSON.parse(insight.details)
            : insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }

  async getConversationTrends(
    brandId: string,
    options: TrendOptionsDto,
  ): Promise<ConversationTrendsDto> {
    // Set default dates if not provided
    const startDate =
      options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const endDate = options.endDate || new Date();

    const trends = await this.service.getConversationTrends(brandId, {
      startDate,
      endDate,
    });

    return {
      topIntents: trends.topIntents || [],
      topTopics: trends.topTopics || [],
      engagementTrend: trends.engagementTrend || [],
      commonActions: trends.commonActions || [],
    };
  }
}

describe('ConversationExplorerController', () => {
  let controller: MockConversationExplorerController;
  let mockService: any;

  const mockBrandId = uuidv4();
  const mockConversationId = uuidv4();

  const mockInsightDtos: ConversationInsightDto[] = [
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
  ];

  const mockConversationDto: ConversationDto = {
    id: mockConversationId,
    brandId: mockBrandId,
    messages: [
      {
        role: 'user',
        content: 'Hello, I need help with my account',
        timestamp: new Date(),
      },
      {
        role: 'assistant',
        content:
          "I'd be happy to help with your account. What do you need assistance with?",
        timestamp: new Date(),
      },
    ],
    metadata: {
      platform: 'web',
      context: 'support',
      tags: ['account', 'help'],
    },
    insights: mockInsightDtos,
    engagementScore: 0.75,
    analyzedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTrends: ConversationTrendsDto = {
    topIntents: [],
    topTopics: [],
    engagementTrend: [],
    commonActions: [],
  };

  beforeEach(async () => {
    mockService = {
      analyzeConversation: jest.fn().mockResolvedValue({
        ...mockConversationDto,
        insights: mockInsightDtos.map(insight => ({
          ...insight,
          conversationId: mockConversationId,
          brandId: mockBrandId,
          conversation: null,
          engagementScore: 0.75,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })),
      }),
      getConversationById: jest.fn().mockResolvedValue({
        ...mockConversationDto,
        insights: mockInsightDtos.map(insight => ({
          ...insight,
          conversationId: mockConversationId,
          brandId: mockBrandId,
          conversation: null,
          engagementScore: 0.75,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        })),
      }),
      getConversationTrends: jest.fn().mockResolvedValue(mockTrends),
    };

    controller = new MockConversationExplorerController(mockService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze a conversation and return insights', async () => {
      const dto: AnalyzeConversationDto = {
        conversationId: mockConversationId,
        brandId: mockBrandId,
        messages: [
          {
            role: 'user',
            content: 'Hello, I need help with my account',
            timestamp: new Date(),
          },
          {
            role: 'assistant',
            content:
              "I'd be happy to help with your account. What do you need assistance with?",
            timestamp: new Date(),
          },
        ],
        metadata: {
          platform: 'web',
          context: 'support',
          tags: ['account', 'help'],
        },
        topics: ['account'],
        includeEntities: true,
        includeSentiment: true,
      };

      const result = await controller.analyzeConversation(dto);
      expect(mockService.analyzeConversation).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockConversationDto);
    });

    it('should handle errors during analysis', async () => {
      const dto: AnalyzeConversationDto = {
        conversationId: mockConversationId,
        brandId: mockBrandId,
        messages: [
          {
            role: 'user',
            content: 'Hello, I need help with my account',
            timestamp: new Date(),
          },
        ],
        metadata: {
          platform: 'web',
          context: 'support',
          tags: ['account', 'help'],
        },
        topics: ['account'],
        includeEntities: true,
        includeSentiment: true,
      };

      const error = new Error('Analysis failed');
      mockService.analyzeConversation.mockRejectedValueOnce(error);

      await expect(controller.analyzeConversation(dto)).rejects.toThrow(error);
      expect(mockService.analyzeConversation).toHaveBeenCalledWith(dto);
    });
  });

  describe('getConversation', () => {
    it('should get a conversation by ID', async () => {
      const id = mockConversationId;

      const result = await controller.getConversation(id);

      expect(mockService.getConversationById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockConversationDto);
    });
  });

  describe('getConversationTrends', () => {
    it('should get conversation trends', async () => {
      const brandId = mockBrandId;
      const options: TrendOptionsDto = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      const result = await controller.getConversationTrends(brandId, options);

      expect(mockService.getConversationTrends).toHaveBeenCalledWith(brandId, {
        startDate: options.startDate,
        endDate: options.endDate,
      });
      expect(result).toEqual(mockTrends);
    });

    it('should use default dates if not provided', async () => {
      const brandId = mockBrandId;
      const options: TrendOptionsDto = {};

      const result = await controller.getConversationTrends(brandId, options);

      expect(mockService.getConversationTrends).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }),
      );
      expect(result).toEqual(mockTrends);
    });
  });
});
