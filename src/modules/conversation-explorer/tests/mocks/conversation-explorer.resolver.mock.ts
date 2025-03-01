import { ConversationExplorerResolver } from '../../resolvers/conversation-explorer.resolver';
import { ConversationAnalysis } from '../../types/conversation-analysis.type';
import { ConversationTrends } from '../../types/conversation-trends.type';

/**
 * Mock implementation of the ConversationExplorerResolver for testing
 */
export class MockConversationExplorerResolver
  implements Partial<ConversationExplorerResolver>
{
  /**
   * Mock method for analyzing a conversation
   */
  analyzeConversation = jest
    .fn()
    .mockImplementation(
      async (input: Record<string, unknown>): Promise<ConversationAnalysis> => {
        return {
          _intents: [
            {
              category: 'account_inquiry',
              confidence: 0.85,
            },
          ],
          _topics: [
            {
              name: 'account',
              relevance: 0.9,
            },
          ],
          entities: [
            {
              type: 'account',
              _value: 'personal',
              confidence: 0.75,
            },
          ],
          _sentiment: 0.65,
          _engagementScore: 0.8,
        };
      },
    );

  /**
   * Mock method for retrieving a conversation by ID
   */
  conversation = jest
    .fn()
    .mockImplementation(
      async (_id: string): Promise<Record<string, unknown>> => {
        return {
          id: 'mock-conversation-id',
          brandId: 'mock-brand-id',
          messages: [],
          _metadata: {
            platform: 'web',
            context: 'support',
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    );

  /**
   * Mock method for retrieving conversations by brand ID
   */
  conversationsByBrand = jest
    .fn()
    .mockImplementation(
      async (
        brandId: string,
        _options?: Record<string, unknown>,
      ): Promise<Array<Record<string, unknown>>> => {
        return [
          {
            id: 'mock-conversation-id-1',
            brandId: 'mock-brand-id',
            messages: [],
            _metadata: {
              platform: 'web',
              context: 'support',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'mock-conversation-id-2',
            brandId: 'mock-brand-id',
            messages: [],
            _metadata: {
              platform: 'mobile',
              context: 'sales',
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
      },
    );

  /**
   * Mock method for retrieving conversation insights
   */
  getConversationInsights = jest
    .fn()
    .mockImplementation(
      async (
        conversationId: string,
      ): Promise<Array<Record<string, unknown>>> => {
        return [
          {
            id: 'mock-insight-id-1',
            conversationId: 'mock-conversation-id',
            type: 'intent',
            category: 'account_inquiry',
            confidence: 0.85,
            createdAt: new Date(),
          },
          {
            id: 'mock-insight-id-2',
            conversationId: 'mock-conversation-id',
            type: 'topic',
            category: 'account',
            confidence: 0.9,
            createdAt: new Date(),
          },
        ];
      },
    );

  /**
   * Mock method for retrieving conversation trends
   */
  getConversationTrends = jest
    .fn()
    .mockImplementation(
      async (
        brandId: string,
        _options?: Record<string, unknown>,
      ): Promise<ConversationTrends> => {
        return {
          topIntents: [
            {
              category: 'account_inquiry',
              count: 25,
              averageConfidence: 0.85,
            },
            {
              category: 'technical_support',
              count: 18,
              averageConfidence: 0.78,
            },
          ],
          topTopics: [
            {
              name: 'account',
              count: 30,
              averageRelevance: 0.9,
            },
            {
              name: 'billing',
              count: 22,
              averageRelevance: 0.82,
            },
          ],
          engagementTrends: [
            {
              date: new Date('2023-01-15'),
              averageEngagement: 0.75,
            },
            {
              date: new Date('2023-01-16'),
              averageEngagement: 0.78,
            },
          ],
          commonActions: [
            {
              type: 'account_view',
              count: 42,
              averageConfidence: 0.88,
            },
            {
              type: 'password_reset',
              count: 15,
              averageConfidence: 0.92,
            },
          ],
        };
      },
    );

  /**
   * Mock method for retrieving conversation trends (_alias)
   */
  conversationTrends = jest
    .fn()
    .mockImplementation(
      async (
        brandId: string,
        _options?: Record<string, unknown>,
      ): Promise<ConversationTrends> => {
        return this.getConversationTrends(brandId, _options);
      },
    );

  /**
   * Mock method for retrieving insights
   */
  getInsights = jest
    .fn()
    .mockImplementation(
      async (
        _options?: Record<string, unknown>,
      ): Promise<Array<Record<string, unknown>>> => {
        return [
          {
            id: 'mock-insight-id-1',
            conversationId: 'mock-conversation-id',
            type: 'intent',
            category: 'account_inquiry',
            confidence: 0.85,
            createdAt: new Date(),
          },
          {
            id: 'mock-insight-id-2',
            conversationId: 'mock-conversation-id',
            type: 'topic',
            category: 'account',
            confidence: 0.9,
            createdAt: new Date(),
          },
        ];
      },
    );
}
