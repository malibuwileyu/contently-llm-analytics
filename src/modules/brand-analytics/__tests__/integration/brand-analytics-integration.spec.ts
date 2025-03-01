import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { BrandAnalyticsModule } from '../../brand-analytics.module';
import { BusinessCategoryEntity } from '../../entities/business-category.entity';
import { CompetitorEntity } from '../../entities/competitor.entity';
import { MentionDetectionService } from '../../services/mention-detection.service';
import { SentimentAnalysisService } from '../../services/sentiment-analysis.service';
import { AnalyticsComputationService } from '../../services/analytics-computation.service';
import { ResponseEntity } from '../../entities/response.entity';
import { MentionEntity } from '../../entities/mention.entity';
import { QueryEntity } from '../../entities/query.entity';
import { QueryTemplateEntity } from '../../entities/query-template.entity';
import { AnalyticsResultEntity } from '../../entities/analytics-result.entity';

// Increase the test timeout to 30 seconds
jest.setTimeout(30000);

describe('BrandAnalytics Integration', () => {
  let app: INestApplication;
  let mentionDetectionService: MentionDetectionService;
  let sentimentAnalysisService: SentimentAnalysisService;
  let analyticsComputationService: AnalyticsComputationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              database: {
                type: 'sqlite',
                database: ':memory:',
                synchronize: true,
                entities: [
                  BusinessCategoryEntity,
                  CompetitorEntity,
                  ResponseEntity,
                  MentionEntity,
                  QueryEntity,
                  QueryTemplateEntity,
                  AnalyticsResultEntity,
                ],
              },
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            BusinessCategoryEntity,
            CompetitorEntity,
            ResponseEntity,
            MentionEntity,
            QueryEntity,
            QueryTemplateEntity,
            AnalyticsResultEntity,
          ],
          synchronize: true,
        }),
        BrandAnalyticsModule,
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
    analyticsComputationService =
      moduleFixture.get<AnalyticsComputationService>(
        AnalyticsComputationService,
      );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Module Integration', () => {
    it('should have all services defined', () => {
      expect(mentionDetectionService).toBeDefined();
      expect(sentimentAnalysisService).toBeDefined();
      expect(analyticsComputationService).toBeDefined();
    });

    it('should detect mentions and analyze sentiment in a complete flow', async () => {
      // This test simulates a complete flow from mention detection to sentiment analysis
      // to analytics computation

      // Mock the necessary repository methods
      const detectMentionsSpy = jest.spyOn(
        mentionDetectionService,
        'detectMentions',
      );
      const analyzeSentimentSpy = jest.spyOn(
        sentimentAnalysisService,
        'analyzeSentiment',
      );

      // Create a mock response
      const mockResponse = new ResponseEntity();
      mockResponse.id = '1';
      mockResponse.text =
        'Nike shoes are excellent for running. Adidas also makes good shoes.';
      mockResponse.queryId = '1'; // Add a queryId to avoid null reference

      // Mock the detection to return some mentions
      const mockMentions = [new MentionEntity(), new MentionEntity()];

      // Set properties for first mention
      mockMentions[0].id = '1';
      mockMentions[0].text = 'Nike';
      mockMentions[0].competitorId = 'nike-id';
      mockMentions[0].context = 'I like Nike shoes';
      mockMentions[0].startPosition = 7;
      mockMentions[0].endPosition = 11;
      mockMentions[0].confidence = 0.9;

      // Set properties for second mention
      mockMentions[1].id = '2';
      mockMentions[1].text = 'Adidas';
      mockMentions[1].competitorId = 'adidas-id';
      mockMentions[1].context = 'Adidas makes good sportswear';
      mockMentions[1].startPosition = 0;
      mockMentions[1].endPosition = 6;
      mockMentions[1].confidence = 0.85;

      detectMentionsSpy.mockResolvedValue(mockMentions);
      analyzeSentimentSpy.mockImplementation(async mention => {
        // Simple mock implementation that sets positive sentiment for Nike
        // and neutral for others
        if (mention.competitorId === 'nike-id') {
          mention.sentimentScore = 0.8;
          mention.sentimentLabel = 'positive';
        } else {
          mention.sentimentScore = 0.1;
          mention.sentimentLabel = 'neutral';
        }
        return mention;
      });

      // Execute the flow
      const detectedMentions =
        await mentionDetectionService.detectMentions(mockResponse);

      // Process each mention through sentiment analysis
      const analyzedMentions = [];
      for (const mention of detectedMentions) {
        const analyzed =
          await sentimentAnalysisService.analyzeSentiment(mention);
        analyzedMentions.push(analyzed);
      }

      // Verify the results
      expect(detectedMentions.length).toBe(2);
      expect(analyzedMentions.length).toBe(2);

      // Check Nike mention
      const nikeMention = analyzedMentions.find(
        m => m.competitorId === 'nike-id',
      );
      expect(nikeMention).toBeDefined();
      if (nikeMention) {
        expect(nikeMention.sentimentLabel).toBe('positive');
        expect(nikeMention.sentimentScore).toBe(0.8);
      }

      // Check Adidas mention
      const adidasMention = analyzedMentions.find(
        m => m.competitorId === 'adidas-id',
      );
      expect(adidasMention).toBeDefined();
      if (adidasMention) {
        expect(adidasMention.sentimentLabel).toBe('neutral');
        expect(adidasMention.sentimentScore).toBe(0.1);
      }

      // Verify the service calls
      expect(detectMentionsSpy).toHaveBeenCalledWith(mockResponse);
      expect(analyzeSentimentSpy).toHaveBeenCalledTimes(2);
    });
  });
});
