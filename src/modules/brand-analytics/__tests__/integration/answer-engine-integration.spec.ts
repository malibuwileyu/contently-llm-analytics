import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { BrandAnalyticsModule } from '../../brand-analytics.module';
import { MentionDetectionService } from '../../services/mention-detection.service';
import { SentimentAnalysisService } from '../../services/sentiment-analysis.service';
import { ResponseEntity } from '../../entities/response.entity';
import { MentionEntity } from '../../entities/mention.entity';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { QueryEntity } from '../../entities/query.entity';
import { QueryTemplateEntity } from '../../entities/query-template.entity';
import { AnalyticsResultEntity } from '../../entities/analytics-result.entity';

// Increase the test timeout to 30 seconds
jest.setTimeout(30000);

// Mock the AnswerEngine module
class MockAnswerEngineService {
  async generateAnswer(query: string): Promise<string> {
    return `Here's information about athletic shoes. Nike and Adidas are popular brands.`;
  }
}

describe('BrandAnalytics-AnswerEngine Integration', () => {
  let app: INestApplication;
  let mentionDetectionService: MentionDetectionService;
  let sentimentAnalysisService: SentimentAnalysisService;
  let answerEngineService: MockAnswerEngineService;

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
            BusinessCategoryEntity,
            CompetitorEntity,
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
          provide: 'AnswerEngineService',
          useClass: MockAnswerEngineService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    mentionDetectionService = moduleFixture.get<MentionDetectionService>(
      MentionDetectionService,
    );
    sentimentAnalysisService = moduleFixture.get<SentimentAnalysisService>(
      SentimentAnalysisService,
    );
    answerEngineService = moduleFixture.get<MockAnswerEngineService>(
      'AnswerEngineService',
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Integration with AnswerEngine', () => {
    it('should detect brand mentions in answer engine responses', async () => {
      // Mock the necessary methods
      const detectMentionsSpy = jest
        .spyOn(mentionDetectionService, 'detectMentions')
        .mockResolvedValue([
          createMockMention('1', 'Nike', 'nike-id'),
          createMockMention('2', 'Adidas', 'adidas-id'),
        ]);

      const generateAnswerSpy = jest.spyOn(
        answerEngineService,
        'generateAnswer',
      );

      // Simulate a user query to the answer engine
      const userQuery = 'What are the best athletic shoes?';
      const answer = await answerEngineService.generateAnswer(userQuery);

      // Create a response entity from the answer
      const response = new ResponseEntity();
      response.id = '1';
      response.text = answer;
      response.queryId = '1'; // Add a queryId to avoid null reference
      response.provider = 'openai'; // Add required fields

      // Process the response with the brand analytics module
      const mentions = await mentionDetectionService.detectMentions(response);

      // Verify the results
      expect(mentions.length).toBe(2);
      expect(mentions[0].text).toBe('Nike');
      expect(mentions[1].text).toBe('Adidas');

      // Verify the service calls
      expect(generateAnswerSpy).toHaveBeenCalledWith(userQuery);
      expect(detectMentionsSpy).toHaveBeenCalledWith(response);
    });

    it('should analyze sentiment of brand mentions in answer engine responses', async () => {
      // Mock the necessary methods
      const detectMentionsSpy = jest
        .spyOn(mentionDetectionService, 'detectMentions')
        .mockResolvedValue([createMockMention('1', 'Nike', 'nike-id')]);

      const analyzeSentimentSpy = jest
        .spyOn(sentimentAnalysisService, 'analyzeSentiment')
        .mockImplementation(async mention => {
          mention.sentimentScore = 0.8;
          mention.sentimentLabel = 'positive';
          return mention;
        });

      // Simulate a user query to the answer engine
      const userQuery = 'What do you think about Nike shoes?';
      const answer = await answerEngineService.generateAnswer(userQuery);

      // Create a response entity from the answer
      const response = new ResponseEntity();
      response.id = '2';
      response.text = answer;
      response.queryId = '2'; // Add a queryId to avoid null reference
      response.provider = 'openai'; // Add required fields

      // Process the response with the brand analytics module
      const mentions = await mentionDetectionService.detectMentions(response);
      const analyzedMention = await sentimentAnalysisService.analyzeSentiment(
        mentions[0],
      );

      // Verify the results
      expect(mentions.length).toBe(1);
      expect(analyzedMention.text).toBe('Nike');
      expect(analyzedMention.sentimentScore).toBe(0.8);
      expect(analyzedMention.sentimentLabel).toBe('positive');

      // Verify the service calls
      expect(detectMentionsSpy).toHaveBeenCalledWith(response);
      expect(analyzeSentimentSpy).toHaveBeenCalledWith(mentions[0]);
    });
  });
});

// Helper function to create test data
function createMockMention(
  id: string,
  text: string,
  competitorId: string,
): MentionEntity {
  const mention = new MentionEntity();
  mention.id = id;
  mention.text = text;
  mention.competitorId = competitorId;
  mention.responseId = '1'; // Add required fields
  mention.startPosition = 0;
  mention.endPosition = text.length;
  mention.context = `Context containing ${text}`;
  return mention;
}
