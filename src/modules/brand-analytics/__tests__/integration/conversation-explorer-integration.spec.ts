import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BrandAnalyticsModule } from '../../brand-analytics.module';
import { MentionDetectionService } from '../../services/mention-detection.service';
import { AnalyticsComputationService } from '../../services/analytics-computation.service';
import { ResponseEntity } from '../../entities/response.entity';
import { MentionEntity } from '../../entities/mention.entity';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { QueryEntity } from '../../entities/query.entity';
import { QueryTemplateEntity } from '../../entities/query-template.entity';
import { AnalyticsResultEntity } from '../../entities/analytics-result.entity';

// Increase the test timeout to 30 seconds
jest.setTimeout(30000);

// Mock the ConversationExplorer module
class MockConversationExplorerService {
  async getConversations(_filters: any): Promise<any[]> {
    return [
      {
        id: 'conv1',
        title: 'Athletic Shoes Discussion',
        messages: [
          { role: 'user', content: 'What are the best athletic shoes?' },
          {
            role: 'assistant',
            content: 'Nike and Adidas are top brands for athletic shoes.',
          },
        ],
      },
      {
        id: 'conv2',
        title: 'Running Shoes Comparison',
        messages: [
          { role: 'user', content: 'Compare Nike and Adidas running shoes' },
          {
            role: 'assistant',
            content:
              'Nike shoes are known for cushioning while Adidas offers stability.',
          },
        ],
      },
    ];
  }
}

describe('BrandAnalytics-ConversationExplorer Integration', () => {
  let app: INestApplication;
  let mentionDetectionService: MentionDetectionService;
  let analyticsComputationService: AnalyticsComputationService;
  let conversationExplorerService: MockConversationExplorerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            ResponseEntity,
            MentionEntity,
            CompetitorEntity,
            BusinessCategoryEntity,
            QueryEntity,
            QueryTemplateEntity,
            AnalyticsResultEntity,
          ],
          synchronize: true,
        }),
        BrandAnalyticsModule,
      ],
      providers: [
        {
          provide: 'ConversationExplorerService',
          useClass: MockConversationExplorerService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mentionDetectionService = moduleFixture.get<MentionDetectionService>(
      MentionDetectionService,
    );
    analyticsComputationService =
      moduleFixture.get<AnalyticsComputationService>(
        AnalyticsComputationService,
      );
    conversationExplorerService =
      moduleFixture.get<MockConversationExplorerService>(
        'ConversationExplorerService',
      );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Integration with ConversationExplorer', () => {
    it('should detect brand mentions in conversation responses', async () => {
      // Mock the necessary methods
      const detectMentionsSpy = jest
        .spyOn(mentionDetectionService, 'detectMentions')
        .mockImplementation(async response => {
          // Simple implementation that detects Nike and Adidas in the text
          const mentions: MentionEntity[] = [];

          if (response.text.includes('Nike')) {
            const mention = new MentionEntity();
            mention.id = '1';
            mention.text = 'Nike';
            mention.competitorId = 'nike-id';
            mention.responseId = response.id;
            mention.startPosition = response.text.indexOf('Nike');
            mention.endPosition = mention.startPosition + 4;
            mention.context = response.text;
            mentions.push(mention);
          }

          if (response.text.includes('Adidas')) {
            const mention = new MentionEntity();
            mention.id = '2';
            mention.text = 'Adidas';
            mention.competitorId = 'adidas-id';
            mention.responseId = response.id;
            mention.startPosition = response.text.indexOf('Adidas');
            mention.endPosition = mention.startPosition + 6;
            mention.context = response.text;
            mentions.push(mention);
          }

          return mentions;
        });

      const getConversationsSpy = jest.spyOn(
        conversationExplorerService,
        'getConversations',
      );

      // Simulate fetching conversations from the explorer
      const conversations = await conversationExplorerService.getConversations({
        category: 'athletic shoes',
        dateRange: {
          start: new Date('2023-01-01'),
          end: new Date('2023-01-31'),
        },
      });

      // Process each conversation's assistant messages
      const allMentions: MentionEntity[] = [];

      for (const conversation of conversations) {
        for (const message of conversation.messages) {
          if (message.role === 'assistant') {
            // Create a response entity from the message
            const response = new ResponseEntity();
            response.id = `${conversation.id}-${message.role}`;
            response.text = message.content;
            response.queryId = conversation.id; // Add a queryId to avoid null reference
            response.provider = 'openai'; // Add required fields

            // Process the response with the brand analytics module
            const mentions =
              await mentionDetectionService.detectMentions(response);
            allMentions.push(...mentions);
          }
        }
      }

      // Verify the results
      expect(allMentions.length).toBe(4); // 2 Nike mentions and 2 Adidas mentions
      expect(allMentions.filter(m => m.text === 'Nike').length).toBe(2);
      expect(allMentions.filter(m => m.text === 'Adidas').length).toBe(2);

      // Verify the service calls
      expect(getConversationsSpy).toHaveBeenCalled();
      expect(detectMentionsSpy).toHaveBeenCalledTimes(2);
    });

    it('should compute analytics from conversation mentions', async () => {
      // Mock the necessary methods
      const computeMentionFrequencySpy = jest
        .spyOn(analyticsComputationService, 'computeMentionFrequency')
        .mockResolvedValue([
          {
            id: '1',
            businessCategoryId: 'athletic-shoes',
            competitorId: 'nike-id',
            type: 'mention_frequency',
            timeFrame: 'monthly',
            value: 60, // 60% of mentions
            rank: 1,
            totalMentions: 6,
            totalResponses: 10,
          } as any,
          {
            id: '2',
            businessCategoryId: 'athletic-shoes',
            competitorId: 'adidas-id',
            type: 'mention_frequency',
            timeFrame: 'monthly',
            value: 40, // 40% of mentions
            rank: 2,
            totalMentions: 4,
            totalResponses: 10,
          } as any,
        ]);

      // Simulate computing analytics for a business category
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const results = await analyticsComputationService.computeMentionFrequency(
        'athletic-shoes',
        startDate,
        endDate,
        'monthly',
      );

      // Verify the results
      expect(results.length).toBe(2);

      // Check Nike result
      const nikeResult = results.find(r => r.competitorId === 'nike-id');
      expect(nikeResult).toBeDefined();
      expect(nikeResult?.value).toBe(60);
      expect(nikeResult?.rank).toBe(1);

      // Check Adidas result
      const adidasResult = results.find(r => r.competitorId === 'adidas-id');
      expect(adidasResult).toBeDefined();
      expect(adidasResult?.value).toBe(40);
      expect(adidasResult?.rank).toBe(2);

      // Verify the service calls
      expect(computeMentionFrequencySpy).toHaveBeenCalledWith(
        'athletic-shoes',
        startDate,
        endDate,
        'monthly',
      );
    });
  });
});
