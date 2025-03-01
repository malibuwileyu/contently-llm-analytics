import { v4 as uuidv4 } from 'uuid';
import { MockConversationExplorerRunner } from './mocks/conversation-explorer.runner.mock';

// Define the DTO types
interface AnalyzeConversationDto {
  conversationId: string;
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

  const mockBrandId = uuidv4();

  beforeEach(() => {
    // Create runner
    runner = new MockConversationExplorerRunner();
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
        conversationId: 'test-conversation-id',
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
      };

      // Act
      const result = await runner.analyzeConversation(input);

      // Assert
      expect(result).toBeDefined();
      expect(result._intents).toHaveLength(1);
      expect(result._topics).toHaveLength(1);
      expect(result.entities).toHaveLength(1);
      expect(runner.analyzeConversation).toHaveBeenCalledWith(input);
    });

    it('should handle errors during analysis', async () => {
      // Arrange
      const input: AnalyzeConversationDto = {
        conversationId: 'test-conversation-id',
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
          tags: ['account', 'help'],
        },
      };

      const error = new Error('Analysis failed');
      runner.analyzeConversation = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(runner.analyzeConversation(input)).rejects.toThrow(
        'Analysis failed',
      );
      expect(runner.analyzeConversation).toHaveBeenCalledWith(input);
    });
  });

  describe('getConversationTrends', () => {
    it('should get conversation trends for a brand', async () => {
      // Arrange
      const options: TrendOptionsDto = {
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-01-31'),
      };

      // Act
      const result = await runner.getConversationTrends(mockBrandId, options);

      // Assert
      expect(result).toBeDefined();
      expect(result.topIntents).toHaveLength(2);
      expect(result.topTopics).toHaveLength(2);
      expect(result.engagementTrends).toHaveLength(2);
      expect(runner.getConversationTrends).toHaveBeenCalledWith(
        mockBrandId,
        options,
      );
    });

    it('should handle errors when getting trends', async () => {
      // Arrange
      const error = new Error('Trend analysis failed');
      runner.getConversationTrends = jest.fn().mockRejectedValue(error);

      // Act & Assert
      await expect(runner.getConversationTrends(mockBrandId)).rejects.toThrow(
        'Trend analysis failed',
      );
      expect(runner.getConversationTrends).toHaveBeenCalledWith(mockBrandId);
    });
  });
});
