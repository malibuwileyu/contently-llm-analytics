import { DataSource } from 'typeorm';
import { ConversationExplorerRunner } from '../runners/conversation-explorer.runner';
import { AnalyzeConversationDto } from '../dto/analyze-conversation.dto';
import { TrendOptionsDto } from '../dto/analyze-conversation.dto';
import { Logger } from '@nestjs/common';

/**
 * This file demonstrates how to use the Conversation Explorer module
 * in a standalone application or script.
 */
async function main() {
  const logger = new Logger('ConversationExplorerExample');

  try {
    logger.log('Initializing Conversation Explorer example');

    // Initialize TypeORM data source
    const dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'contently',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
    });

    await dataSource.initialize();
    logger.log('Database connection established');

    // Initialize the cache service
    const cacheService = {
      get: async (key: string) => {
        // In a real application, this would use Redis or another caching solution
        logger.debug(`Cache GET: ${key}`);
        return null;
      },
      set: async (key: string, value: any, ttl: number) => {
        // In a real application, this would use Redis or another caching solution
        logger.debug(`Cache SET: ${key}, TTL: ${ttl}s`);
      },
    };

    // Initialize the metrics service
    const metricsService = {
      recordAnalysisDuration: (duration: number) => {
        logger.debug(`Analysis duration: ${duration}ms`);
      },
      incrementErrorCount: (errorType: string) => {
        logger.warn(`Error counter incremented: ${errorType}`);
      },
    };

    // Initialize the Conversation Explorer runner
    const runner = new ConversationExplorerRunner(
      dataSource,
      process.env.NLP_SERVICE_URL || 'http://nlp-service:3000',
      process.env.SEARCH_SERVICE_URL || 'http://search-service:9200',
      cacheService,
      metricsService,
    );

    // Example 1: Analyze a conversation
    logger.log('Example 1: Analyzing a conversation');
    const conversationData: AnalyzeConversationDto = {
      brandId: '550e8400-e29b-41d4-a716-446655440000', // Example UUID
      messages: [
        {
          role: 'user',
          content:
            'Hi, I need help with my subscription. I was charged twice this month.',
          timestamp: new Date(),
        },
        {
          role: 'assistant',
          content:
            "I'm sorry to hear that. Let me check your account details. Could you please confirm your email address?",
          timestamp: new Date(Date.now() + 30000), // 30 seconds later
        },
        {
          role: 'user',
          content: "It's john.doe@example.com",
          timestamp: new Date(Date.now() + 60000), // 60 seconds later
        },
      ],
      metadata: {
        platform: 'web',
        context: 'billing',
        tags: ['subscription', 'billing', 'support'],
      },
    };

    const analyzedConversation =
      await runner.analyzeConversation(conversationData);
    logger.log('Conversation analyzed successfully');
    logger.log(`Conversation ID: ${analyzedConversation.id}`);
    logger.log(`Engagement Score: ${analyzedConversation.engagementScore}`);
    logger.log(`Number of insights: ${analyzedConversation.insights.length}`);

    // Example 2: Get conversation trends
    logger.log('Example 2: Getting conversation trends');
    const trendOptions: TrendOptionsDto = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      endDate: new Date(),
    };

    const trends = await runner.getConversationTrends(
      conversationData.brandId,
      trendOptions,
    );
    logger.log('Conversation trends retrieved successfully');
    logger.log(`Top intents: ${trends.topIntents.length}`);
    logger.log(`Top topics: ${trends.topTopics.length}`);
    logger.log(
      `Engagement trend data points: ${trends.engagementTrends.length}`,
    );
    logger.log(`Common actions: ${trends.commonActions.length}`);

    // Close the database connection
    await dataSource.destroy();
    logger.log('Database connection closed');
  } catch (error) {
    logger.error(
      `Error in Conversation Explorer example: ${error.message}`,
      error.stack,
    );
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

export { main };
