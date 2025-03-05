import { Test, TestingModule } from '@nestjs/testing';
import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  MockAIProviderService,
  MockAnswerEngineService,
  MockConversationExplorerService,
} from './mocks/services.mock';

describe('LLM Search Visibility Analytics', () => {
  let module: TestingModule;
  let aiProviderService: MockAIProviderService;
  let answerEngineService: MockAnswerEngineService;
  let conversationExplorerService: MockConversationExplorerService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: 'AIProviderService',
          useClass: MockAIProviderService,
        },
        {
          provide: 'AnswerEngineService',
          useClass: MockAnswerEngineService,
        },
        {
          provide: 'ConversationExplorerService',
          useClass: MockConversationExplorerService,
        },
      ],
    }).compile();

    aiProviderService = module.get('AIProviderService');
    answerEngineService = module.get('AnswerEngineService');
    conversationExplorerService = module.get('ConversationExplorerService');
  });

  afterAll(async () => {
    await module.close();
  });

  it('should analyze brand visibility without previous context bias', async () => {
    // Test data - Using a different brand and neutral query
    const brandId = 'adidas';
    const query = 'List major athletic wear manufacturers';

    // 1. Generate AI response and check ranking
    const aiResponse = await aiProviderService.generateResponse({
      query,
      context: {
        brandId,
        platform: 'test',
        clearContext: true, // Signal to ignore previous conversation context
      },
    });

    // 2. Analyze visibility with Answer Engine
    const brandMentions = await answerEngineService.analyzeContent(
      aiResponse.content,
      brandId,
      {
        query,
        response: aiResponse.content,
        platform: 'test',
      },
    );

    const brandHealth = await answerEngineService.getBrandHealth(brandId);
    const citations = await answerEngineService.getBrandCitations(brandId);

    // 3. Track visibility patterns
    const conversation = await conversationExplorerService.trackConversation({
      brandId,
      query,
      response: aiResponse.content,
      metadata: {
        platform: 'test',
        timestamp: new Date().toISOString(),
        isContextCleared: true,
      },
    });

    const insights = await conversationExplorerService.analyzeConversation(
      conversation.id,
    );
    const metrics =
      await conversationExplorerService.getConversationMetrics(brandId);

    // 4. Write results to file
    const results = {
      aiResponse,
      brandMentions,
      brandHealth,
      citations,
      conversation,
      insights,
      metrics,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = join(
      __dirname,
      '..',
      'test-outputs',
      `llm-visibility-no-context-${timestamp}.txt`,
    );

    writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

    // 5. Visibility-focused assertions
    // We expect more balanced results without context bias
    expect(aiResponse.metadata.rankingData.brandPosition).toBeLessThanOrEqual(
      3,
    );
    expect(
      Object.keys(aiResponse.metadata.rankingData.competitorPositions).length,
    ).toBeGreaterThan(2);

    const mention = brandMentions[0];
    expect(mention.visibility.prominence).toBeGreaterThan(0.5);
    expect(mention.visibility.competitorProximity.length).toBeGreaterThan(0);
    expect(mention.knowledgeBaseMetrics.categoryLeadership).toBeDefined();

    expect(brandHealth.visibilityMetrics.overallVisibility).toBeGreaterThan(
      0.5,
    );
    expect(brandHealth.llmPresence.knowledgeBaseStrength).toBeGreaterThan(0.5);

    expect(conversation.visibilityMetrics.competitorPresence).toBe(true);
    expect(metrics.visibilityStats.competitorCooccurrence).toBeDefined();
  });

  it('should analyze brand visibility in LLM responses', async () => {
    // Test data
    const brandId = 'nike';
    const query = 'Compare top athletic wear brands';

    // 1. Generate AI response and check ranking
    const aiResponse = await aiProviderService.generateResponse({
      query,
      context: {
        brandId,
        platform: 'test',
      },
    });

    // 2. Analyze visibility with Answer Engine
    const brandMentions = await answerEngineService.analyzeContent(
      aiResponse.content,
      brandId,
      {
        query,
        response: aiResponse.content,
        platform: 'test',
      },
    );

    const brandHealth = await answerEngineService.getBrandHealth(brandId);
    const citations = await answerEngineService.getBrandCitations(brandId);

    // 3. Track visibility patterns
    const conversation = await conversationExplorerService.trackConversation({
      brandId,
      query,
      response: aiResponse.content,
      metadata: {
        platform: 'test',
        timestamp: new Date().toISOString(),
      },
    });

    const insights = await conversationExplorerService.analyzeConversation(
      conversation.id,
    );
    const metrics =
      await conversationExplorerService.getConversationMetrics(brandId);

    // 4. Write results to file
    const results = {
      aiResponse,
      brandMentions,
      brandHealth,
      citations,
      conversation,
      insights,
      metrics,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = join(
      __dirname,
      '..',
      'test-outputs',
      `llm-visibility-test-${timestamp}.txt`,
    );

    writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

    // 5. Visibility-focused assertions
    expect(aiResponse.metadata.rankingData.brandPosition).toBe(1);
    expect(
      Object.keys(aiResponse.metadata.rankingData.competitorPositions).length,
    ).toBeGreaterThan(0);

    const mention = brandMentions[0];
    expect(mention.position.isLeading).toBe(true);
    expect(mention.visibility.prominence).toBeGreaterThan(0.8);
    expect(mention.visibility.competitorProximity).toBeDefined();
    expect(mention.knowledgeBaseMetrics.categoryLeadership).toBe('dominant');

    expect(brandHealth.visibilityMetrics.overallVisibility).toBeGreaterThan(
      0.8,
    );
    expect(brandHealth.llmPresence.knowledgeBaseStrength).toBeGreaterThan(0.8);
    expect(brandHealth.trendsOverTime.visibilityTrend).toBe('increasing');

    expect(conversation.visibilityMetrics.position).toBe(1);
    expect(conversation.visibilityMetrics.prominence).toBeGreaterThan(0.8);

    const insight = insights[0];
    expect(insight.type).toBe('visibility_pattern');
    expect(insight.metadata.contextPattern).toBe('natural_ordering');

    expect(metrics.visibilityStats.averagePosition).toBeLessThan(2);
    expect(metrics.llmPatterns.categoryLeadership['athletic-wear']).toBe(
      'dominant',
    );
    expect(metrics.trendsOverTime.visibilityTrend).toBe('upward');
  });
});
