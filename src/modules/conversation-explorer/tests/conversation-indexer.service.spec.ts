import { Test, TestingModule } from '@nestjs/testing';
import { ConversationIndexerService, Conversation } from '../services/conversation-indexer.service';
import { ConversationAnalysis } from '../services/conversation-analyzer.service';
import { v4 as uuidv4 } from 'uuid';

describe('ConversationIndexerService', () => {
  let service: ConversationIndexerService;
  let insightRepository: any;
  let searchService: any;

  const mockConversation: Conversation = {
    id: uuidv4(),
    brandId: uuidv4(),
    messages: [
      { role: 'user', content: 'Hello, I need help with my account', timestamp: new Date() },
      { role: 'assistant', content: 'I\'d be happy to help with your account. What seems to be the issue?', timestamp: new Date() },
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

  const mockAnalysis: ConversationAnalysis = {
    intents: [
      { category: 'help', confidence: 0.85, details: { source: 'greeting' } }
    ],
    sentiment: {
      overall: 0.6,
      progression: 0.2,
      aspects: [
        { aspect: 'service', score: 0.7 }
      ]
    },
    topics: [
      { name: 'account_issue', relevance: 0.9, mentions: 2 }
    ],
    actions: [
      { type: 'request_information', confidence: 0.75, context: { target: 'account' } }
    ]
  };

  beforeEach(async () => {
    // Create mock implementations
    insightRepository = {
      create: jest.fn().mockImplementation((data) => ({
        id: uuidv4(),
        ...data
      })),
      save: jest.fn().mockImplementation((entity) => Promise.resolve(entity))
    };

    searchService = {
      indexConversation: jest.fn().mockResolvedValue(undefined)
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationIndexerService,
        {
          provide: 'ConversationInsightRepository',
          useValue: insightRepository,
        },
        {
          provide: 'SearchService',
          useValue: searchService,
        },
      ],
    }).compile();

    service = module.get<ConversationIndexerService>(ConversationIndexerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('indexConversation', () => {
    it('should index a conversation and its insights', async () => {
      // Act
      await service.indexConversation(mockConversation, mockAnalysis);

      // Assert
      // Check that insights were created for intents, topics, actions, and sentiment
      expect(insightRepository.create).toHaveBeenCalledTimes(4);
      expect(insightRepository.save).toHaveBeenCalledTimes(4);
      
      // Check that the conversation was indexed for search
      expect(searchService.indexConversation).toHaveBeenCalledWith({
        id: mockConversation.id,
        content: expect.any(String),
        metadata: expect.objectContaining({
          insights: mockAnalysis
        })
      });
    });
  });
}); 