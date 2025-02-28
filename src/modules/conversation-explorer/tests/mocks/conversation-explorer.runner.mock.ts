import { ConversationAnalysis } from '../../types/conversation-analysis.type';
import { ConversationTrends } from '../../types/conversation-trends.type';

/**
 * Mock implementation of the ConversationExplorerRunner for testing
 */
export class MockConversationExplorerRunner {
  // Mock methods with Jest spies
  analyzeConversation = jest.fn().mockImplementation(async (_input: Record<string, unknown>): Promise<ConversationAnalysis> => {
    return this.getMockAnalysisResult();
  });

  getConversationTrends = jest.fn().mockImplementation(async (_brandId: string, _options?: Record<string, unknown>): Promise<ConversationTrends> => {
    return this.getMockTrendsResult();
  });

  /**
   * Get a mock conversation analysis result
   * @returns A mock ConversationAnalysis object
   */
  private getMockAnalysisResult(): ConversationAnalysis {
    return {
      intents: [
        {
          category: 'account_inquiry',
          confidence: 0.85
        }
      ],
      topics: [
        {
          name: 'account',
          relevance: 0.9
        }
      ],
      entities: [
        {
          type: 'account',
          value: 'personal',
          confidence: 0.75
        }
      ],
      sentiment: 0.65,
      engagementScore: 0.8
    };
  }

  /**
   * Get a mock conversation trends result
   * @returns A mock ConversationTrends object
   */
  private getMockTrendsResult(): ConversationTrends {
    return {
      topIntents: [
        {
          category: 'account_inquiry',
          count: 25,
          averageConfidence: 0.85
        },
        {
          category: 'technical_support',
          count: 18,
          averageConfidence: 0.78
        }
      ],
      topTopics: [
        {
          name: 'account',
          count: 30,
          averageRelevance: 0.9
        },
        {
          name: 'billing',
          count: 22,
          averageRelevance: 0.82
        }
      ],
      engagementTrends: [
        {
          date: new Date('2023-01-15'),
          averageEngagement: 0.75
        },
        {
          date: new Date('2023-01-16'),
          averageEngagement: 0.78
        }
      ],
      commonActions: [
        {
          type: 'account_view',
          count: 42,
          averageConfidence: 0.88
        },
        {
          type: 'password_reset',
          count: 15,
          averageConfidence: 0.92
        }
      ]
    };
  }
} 