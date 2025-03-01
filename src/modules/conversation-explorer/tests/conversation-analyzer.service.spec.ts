import { Test, TestingModule } from '@nestjs/testing';
import { ConversationAnalyzerService } from '../services/conversation-analyzer.service';
import { Message } from '../interfaces/conversation-analysis.interface';
import { createHash } from 'crypto';

describe('ConversationAnalyzerService', () => {
  let service: ConversationAnalyzerService;
  let nlpService: any;
  let cacheService: any;

  const mockMessages: Message[] = [
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
  ];

  const mockNlpAnalysis = {
    intents: [
      { category: 'help', confidence: 0.85, context: { source: 'greeting' } },
    ],
    sentiment: {
      score: 0.6,
      progression: 0.2,
      aspects: [{ aspect: 'service', score: 0.7 }],
    },
    topics: [{ name: 'account_issue', relevance: 0.9, mentions: 2 }],
    actions: [
      {
        type: 'request_information',
        confidence: 0.75,
        context: { target: 'account' },
      },
    ],
  };

  beforeEach(async () => {
    // Create mock implementations
    nlpService = {
      analyzeConversation: jest.fn().mockResolvedValue(mockNlpAnalysis),
    };

    cacheService = {
      getOrSet: jest
        .fn()
        .mockImplementation(
          (key: string, factory: () => Promise<any>, ttl?: number) => factory(),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationAnalyzerService,
        {
          provide: 'NLPService',
          useValue: nlpService,
        },
        {
          provide: 'CacheService',
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<ConversationAnalyzerService>(
      ConversationAnalyzerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeConversation', () => {
    it('should analyze a conversation and return the result', async () => {
      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(nlpService.analyzeConversation).toHaveBeenCalledWith(mockMessages);
      expect(result).toEqual({
        intents: [
          {
            category: 'help',
            confidence: 0.85,
            details: { source: 'greeting' },
          },
        ],
        sentiment: {
          overall: 0.6,
          progression: 0.2,
          aspects: [{ aspect: 'service', score: 0.7 }],
        },
        topics: [{ name: 'account_issue', relevance: 0.9, mentions: 2 }],
        actions: [
          {
            type: 'request_information',
            confidence: 0.75,
            context: { target: 'account' },
          },
        ],
      });
    });

    it('should use cache when available', async () => {
      // Arrange
      const cachedResult = {
        intents: [{ category: 'cached_intent', confidence: 0.9 }],
        sentiment: { overall: 0.5, progression: 0.1, aspects: [] },
        topics: [{ name: 'cached_topic', relevance: 0.8, mentions: 1 }],
        actions: [{ type: 'cached_action', confidence: 0.7, context: {} }],
      };

      cacheService.getOrSet.mockResolvedValue(cachedResult);

      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(result).toEqual(cachedResult);

      // Verify cache key generation
      const expectedCacheKey = `conversation:${createHash('md5')
        .update(JSON.stringify(mockMessages))
        .digest('hex')}`;

      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expectedCacheKey,
        expect.any(Function),
        900,
      );
    });

    it('should handle errors from NLP service', async () => {
      // Arrange
      const error = new Error('NLP service error');
      nlpService.analyzeConversation.mockRejectedValue(error);
      cacheService.getOrSet.mockImplementation(
        (key: string, factory: () => Promise<any>) => factory(),
      );

      // Act & Assert
      await expect(service.analyzeConversation(mockMessages)).rejects.toThrow(
        error,
      );
    });
  });

  describe('private methods', () => {
    it('should extract intents correctly', async () => {
      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(result.intents).toEqual([
        { category: 'help', confidence: 0.85, details: { source: 'greeting' } },
      ]);
    });

    it('should calculate sentiment correctly', async () => {
      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(result.sentiment).toEqual({
        overall: 0.6,
        progression: 0.2,
        aspects: [{ aspect: 'service', score: 0.7 }],
      });
    });

    it('should identify topics correctly', async () => {
      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(result.topics).toEqual([
        { name: 'account_issue', relevance: 0.9, mentions: 2 },
      ]);
    });

    it('should extract actions correctly', async () => {
      // Act
      const result = await service.analyzeConversation(mockMessages);

      // Assert
      expect(result.actions).toEqual([
        {
          type: 'request_information',
          confidence: 0.75,
          context: { target: 'account' },
        },
      ]);
    });
  });
});
