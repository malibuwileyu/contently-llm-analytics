import { Test, TestingModule } from '@nestjs/testing';
import { ConversationExplorerService } from '../services/conversation-explorer.service';
import { AnalyzeConversationDto } from '../dto/analyze-conversation.dto';
import { ConversationAnalyzerService } from '../services/conversation-analyzer.service';
import { ConversationIndexerService } from '../services/conversation-indexer.service';
import { v4 as uuidv4 } from 'uuid';
import { ConversationInsightRepository } from '../repositories/conversation-insight.repository';
import { MetricsService } from '../../../modules/metrics/metrics.service';

describe('ConversationExplorerService', () => {
  let service: ConversationExplorerService;
  let conversationRepo: any;
  let conversationInsightRepo: any;
  let analyzerService: any;
  let indexerService: any;
  let metricsService: any;

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
        content:
          "I'd be happy to help with your account. What seems to be the issue?",
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
    ],
    engagementScore: 0.75,
    analyzedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
  };

  const mockAnalysis = {
    intents: [
      {
        category: 'account_inquiry',
        confidence: 0.85,
        details: { relevance: 0.9 },
      },
    ],
    sentiment: {
      overall: 0.6,
      progression: 0.2,
      aspects: [{ aspect: 'service', score: 0.7 }],
    },
    topics: [{ name: 'account', relevance: 0.9, mentions: 2 }],
    actions: [
      {
        type: 'request_info',
        confidence: 0.75,
        context: { target: 'account' },
      },
    ],
  };

  const mockEngagementTrend = [{ date: new Date(), averageEngagement: 0.75 }];

  const mockTrends = {
    topIntents: [
      { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
    ],
    topTopics: [{ name: 'account', count: 8, averageRelevance: 0.8 }],
    commonActions: [{ type: 'request_info', count: 5, averageConfidence: 0.7 }],
    engagementTrend: mockEngagementTrend,
  };

  beforeEach(async () => {
    conversationRepo = {
      findById: jest.fn().mockResolvedValue(mockConversation),
      findByBrandId: jest.fn().mockResolvedValue([mockConversation]),
      getTrends: jest.fn().mockResolvedValue(mockTrends),
      save: jest.fn().mockResolvedValue(mockConversation),
      getEngagementTrend: jest.fn().mockResolvedValue(mockEngagementTrend),
      findWithInsights: jest.fn().mockResolvedValue(mockConversation),
    };

    conversationInsightRepo = {
      create: jest
        .fn()
        .mockReturnValue({ save: jest.fn().mockResolvedValue({}) }),
      findByConversationId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue({}),
    };

    analyzerService = {
      analyzeConversation: jest.fn().mockResolvedValue(mockAnalysis),
    };

    indexerService = {
      indexConversation: jest.fn().mockResolvedValue(undefined),
    };

    metricsService = {
      recordAnalysisDuration: jest.fn(),
      incrementErrorCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationExplorerService,
        {
          provide: 'ConversationRepository',
          useValue: conversationRepo,
        },
        {
          provide: ConversationInsightRepository,
          useValue: conversationInsightRepo,
        },
        {
          provide: ConversationAnalyzerService,
          useValue: analyzerService,
        },
        {
          provide: ConversationIndexerService,
          useValue: indexerService,
        },
        {
          provide: MetricsService,
          useValue: metricsService,
        },
      ],
    }).compile();

    service = module.get<ConversationExplorerService>(
      ConversationExplorerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze conversation and save insights', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        conversationId: uuidv4(),
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
              "I'd be happy to help with your account. What seems to be the issue?",
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
      const result = await service.analyzeConversation(input);

      // Assert
      expect(analyzerService.analyzeConversation).toHaveBeenCalledWith(
        input.messages,
      );
      expect(conversationRepo.save).toHaveBeenCalled();
      expect(indexerService.indexConversation).toHaveBeenCalled();
      expect(metricsService.recordAnalysisDuration).toHaveBeenCalled();
      expect(result).toEqual(mockConversation);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        conversationId: uuidv4(),
        brandId: mockBrandId,
        messages: [{ role: 'user', content: 'Hello', timestamp: new Date() }],
        metadata: {
          platform: 'web',
          context: 'support',
          tags: [],
        },
      };

      const error = new Error('Analysis failed');
      analyzerService.analyzeConversation.mockRejectedValue(error);

      // Act & Assert
      await expect(service.analyzeConversation(input)).rejects.toThrow(error);
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith(
        'analysis_failure',
      );
    });
  });

  describe('getConversationTrends', () => {
    it('should retrieve trends successfully', async () => {
      // Arrange
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      // Act
      const result = await service.getConversationTrends(mockBrandId, options);

      // Assert
      expect(conversationRepo.getTrends).toHaveBeenCalledWith(
        mockBrandId,
        options,
      );
      expect(result).toHaveProperty('topIntents');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('engagementTrend');
      expect(result).toHaveProperty('commonActions');
    });
  });

  describe('findByBrandId', () => {
    it('should find conversations by brand ID', async () => {
      // Act
      const result = await service.findByBrandId(mockBrandId);

      // Assert
      expect(conversationRepo.findByBrandId).toHaveBeenCalledWith(
        mockBrandId,
        {},
      );
      expect(result).toEqual([mockConversation]);
    });
  });
});
