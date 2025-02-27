import { Test, TestingModule } from '@nestjs/testing';
import { ConversationExplorerService, AnalyzeConversationDto } from '../services/conversation-explorer.service';
import { ConversationAnalyzerService } from '../services/conversation-analyzer.service';
import { ConversationIndexerService, Conversation } from '../services/conversation-indexer.service';
import { v4 as uuidv4 } from 'uuid';

describe('ConversationExplorerService', () => {
  let service: ConversationExplorerService;
  let conversationRepo: any;
  let analyzerService: any;
  let indexerService: any;
  let metricsService: any;

  const mockBrandId = uuidv4();
  
  const mockConversation = {
    id: uuidv4(),
    brandId: mockBrandId,
    messages: [
      { role: 'user', content: 'Hello, I need help with my account', timestamp: new Date() },
      { role: 'assistant', content: 'I\'d be happy to help with your account. What seems to be the issue?', timestamp: new Date() },
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
      }
    ],
    engagementScore: 0.75,
    analyzedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  };

  const mockAnalysis = {
    intents: [
      { category: 'account_inquiry', confidence: 0.85, details: { relevance: 0.9 } }
    ],
    sentiment: {
      overall: 0.6,
      progression: 0.2,
      aspects: [
        { aspect: 'service', score: 0.7 }
      ]
    },
    topics: [
      { name: 'account', relevance: 0.9, mentions: 2 }
    ],
    actions: [
      { type: 'request_info', confidence: 0.75, context: { target: 'account' } }
    ]
  };

  const mockTrends = {
    topIntents: [
      { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
    ],
    topTopics: [
      { name: 'account', count: 8, averageRelevance: 0.8 },
    ],
    engagementTrends: [
      { date: new Date(), averageEngagement: 0.75 },
    ],
    commonActions: [
      { type: 'request_info', count: 5, averageConfidence: 0.7 },
    ],
  };

  beforeEach(async () => {
    // Create mock implementations
    conversationRepo = {
      save: jest.fn().mockResolvedValue(mockConversation),
      findWithInsights: jest.fn().mockResolvedValue(mockConversation),
      findByBrandId: jest.fn().mockResolvedValue([mockConversation]),
      getEngagementTrend: jest.fn().mockResolvedValue(mockTrends.engagementTrends),
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
          provide: ConversationAnalyzerService,
          useValue: analyzerService,
        },
        {
          provide: ConversationIndexerService,
          useValue: indexerService,
        },
        {
          provide: 'MetricsService',
          useValue: metricsService,
        },
      ],
    }).compile();

    service = module.get<ConversationExplorerService>(ConversationExplorerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze conversation and save insights', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        brandId: mockBrandId,
        messages: [
          { role: 'user', content: 'Hello, I need help with my account', timestamp: new Date() },
          { role: 'assistant', content: 'I\'d be happy to help with your account. What seems to be the issue?', timestamp: new Date() },
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
      expect(analyzerService.analyzeConversation).toHaveBeenCalledWith(input.messages);
      expect(conversationRepo.save).toHaveBeenCalled();
      expect(indexerService.indexConversation).toHaveBeenCalled();
      expect(metricsService.recordAnalysisDuration).toHaveBeenCalled();
      expect(result).toEqual(mockConversation);
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        brandId: mockBrandId,
        messages: [
          { role: 'user', content: 'Hello', timestamp: new Date() },
        ],
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
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith('analysis_failure');
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
      expect(conversationRepo.findByBrandId).toHaveBeenCalledWith(mockBrandId, expect.any(Object));
      expect(conversationRepo.getEngagementTrend).toHaveBeenCalledWith(
        mockBrandId,
        options.startDate,
        options.endDate
      );
      expect(result).toHaveProperty('topIntents');
      expect(result).toHaveProperty('topTopics');
      expect(result).toHaveProperty('engagementTrends');
      expect(result).toHaveProperty('commonActions');
    });

    it('should handle errors when getting trends', async () => {
      // Arrange
      const options = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      const error = new Error('Failed to get trends');
      conversationRepo.findByBrandId.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getConversationTrends(mockBrandId, options)).rejects.toThrow(error);
      expect(metricsService.incrementErrorCount).toHaveBeenCalledWith('trends_error');
    });
  });
}); 