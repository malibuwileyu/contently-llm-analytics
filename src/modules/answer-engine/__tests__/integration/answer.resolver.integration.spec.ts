import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AnswerResolver } from '../../graphql/answer.resolver';
import { AnswerEngineService } from '../../services/answer-engine.service';
import { BrandMention } from '../../entities/brand-mention.entity';
import { BrandHealth, SentimentTrend } from '../../interfaces/sentiment-analysis.interface';
import { AuthGuard } from '../../../../auth/guards/auth.guard';
import * as request from 'supertest';

describe('AnswerResolver Integration', () => {
  let app: INestApplication;
  let answerEngineService: Partial<AnswerEngineService>;

  beforeEach(async () => {
    // Create mocks
    answerEngineService = {
      analyzeMention: jest.fn(),
      getBrandHealth: jest.fn(),
    };

    const pubSub = {
      publish: jest.fn(),
      asyncIterator: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false,
        }),
      ],
      providers: [
        AnswerResolver,
        {
          provide: AnswerEngineService,
          useValue: answerEngineService,
        },
        {
          provide: 'PUB_SUB',
          useValue: pubSub,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GraphQL Queries', () => {
    it('should get brand health metrics', async () => {
      // Arrange
      const brandId = 'brand-123';
      const sentimentTrend: SentimentTrend[] = [
        { date: new Date('2023-01-01'), averageSentiment: 0.7 },
        { date: new Date('2023-01-02'), averageSentiment: 0.8 },
      ];
      const health: BrandHealth = {
        overallSentiment: 0.75,
        trend: sentimentTrend,
        mentionCount: 2,
      };

      (answerEngineService.getBrandHealth as jest.Mock).mockResolvedValue(health);

      // Act & Assert
      const query = `
        query {
          getBrandHealth(input: { brandId: "${brandId}", startDate: "2023-01-01", endDate: "2023-01-31" }) {
            overallSentiment
            mentionCount
            trend {
              date
              sentiment
            }
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(response.body.data.getBrandHealth).toBeDefined();
      expect(response.body.data.getBrandHealth.overallSentiment).toBe(health.overallSentiment);
      expect(response.body.data.getBrandHealth.mentionCount).toBe(health.mentionCount);
      expect(answerEngineService.getBrandHealth).toHaveBeenCalledWith(brandId);
    });
  });

  describe('GraphQL Mutations', () => {
    it('should analyze content', async () => {
      // Arrange
      const brandId = 'brand-123';
      const content = 'This is a test content';
      const mention: BrandMention = {
        id: 'mention-123',
        brandId,
        content,
        sentiment: 0.8,
        context: {
          query: 'test query',
          response: 'test response',
          platform: 'test platform',
        } as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as BrandMention;

      (answerEngineService.analyzeMention as jest.Mock).mockResolvedValue(mention);

      // Act & Assert
      const mutation = `
        mutation {
          analyzeContent(data: {
            brandId: "${brandId}",
            content: "${content}",
            context: {
              query: "test query",
              response: "test response",
              platform: "test platform"
            }
          }) {
            id
            brandId
            content
            sentiment
            context
          }
        }
      `;

      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: mutation })
        .expect(200);

      expect(response.body.data.analyzeContent).toBeDefined();
      expect(response.body.data.analyzeContent.id).toBe(mention.id);
      expect(response.body.data.analyzeContent.brandId).toBe(mention.brandId);
      expect(response.body.data.analyzeContent.content).toBe(mention.content);
      expect(answerEngineService.analyzeMention).toHaveBeenCalled();
    });
  });
}); 