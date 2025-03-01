import { Test, TestingModule } from '@nestjs/testing';
import { ConversationIndexerService } from '../services/conversation-indexer.service';
import { Conversation } from '../entities/conversation.entity';
import { ConversationAnalysis } from '../interfaces/conversation-analysis.interface';
import { v4 as uuidv4 } from 'uuid';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConversationInsight } from '../entities/conversation-insight.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Create a mock SearchService
const mockSearchService = {
  indexConversation: jest.fn().mockResolvedValue(undefined),
};

// Create a custom ConversationIndexerService for testing
@Injectable()
class TestConversationIndexerService extends ConversationIndexerService {
  constructor(
    @InjectRepository(ConversationInsight)
    insightRepo: Repository<ConversationInsight>,
  ) {
    super(insightRepo, mockSearchService);
  }
}

// Helper function to convert our mock to the expected Conversation type
function asConversation(mock: any): Conversation {
  return mock as unknown as Conversation;
}

describe('ConversationIndexerService', () => {
  let service: ConversationIndexerService;
  let insightRepository: any;

  // Create mock with properties matching the entity definition
  const mockConversation = {
    id: 'test-id',
    brandId: 'test-brand-id',
    messages: [],
    metadata: {
      platform: 'test-platform',
      context: 'test-context',
      tags: ['test-tag'],
    },
    insights: [],
    engagementScore: 0.5,
    analyzedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as unknown as Date,
  };

  const mockAnalysis: ConversationAnalysis = {
    intents: [
      { category: 'help', confidence: 0.85, details: { source: 'greeting' } },
    ],
    sentiment: {
      overall: 0.8,
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
    insightRepository = {
      create: jest.fn().mockImplementation(data => ({
        id: uuidv4(),
        ...data,
      })),
      save: jest.fn().mockImplementation(entity => Promise.resolve(entity)),
    };

    // Reset mock calls
    mockSearchService.indexConversation.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ConversationIndexerService,
          useClass: TestConversationIndexerService,
        },
        {
          provide: getRepositoryToken(ConversationInsight),
          useValue: insightRepository,
        },
      ],
    }).compile();

    service = module.get<ConversationIndexerService>(
      ConversationIndexerService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('indexConversation', () => {
    it('should index a conversation and its insights', async () => {
      // Act
      await service.indexConversation(
        asConversation(mockConversation),
        mockAnalysis,
      );

      // Assert
      // Check that insights were created for intents, topics, actions, and sentiment
      expect(insightRepository.create).toHaveBeenCalledTimes(5);
      expect(insightRepository.save).toHaveBeenCalledTimes(5);

      // Check that the conversation was indexed for search
      expect(mockSearchService.indexConversation).toHaveBeenCalledTimes(1);
      expect(mockSearchService.indexConversation).toHaveBeenCalledWith({
        id: mockConversation.id,
        content: expect.any(String),
        metadata: expect.any(Object),
      });
    });
  });
});
