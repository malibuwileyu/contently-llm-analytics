import { v4 as uuidv4 } from 'uuid';

export class MockConversationExplorerRunner {
  constructor(
    private readonly dataSource: any,
    private readonly nlpServiceUrl: string,
    private readonly searchServiceUrl: string,
    private readonly cacheService?: any,
    private readonly metricsService?: any,
  ) {}

  async analyzeConversation(input: any) {
    return {
      id: uuidv4(),
      brandId: input.brandId,
      messages: input.messages,
      metadata: input.metadata,
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
    };
  }

  async getConversationTrends(brandId: string, options?: any) {
    return {
      topIntents: [
        { category: 'account_inquiry', count: 10, averageConfidence: 0.85 },
      ],
      topTopics: [
        { name: 'account', count: 8, averageRelevance: 0.8 },
      ],
      engagementTrends: [
        { date: new Date(), averageEngagement: 0.65 },
      ],
      commonActions: [
        { type: 'request_info', count: 12, averageConfidence: 0.82 },
      ],
    };
  }
} 