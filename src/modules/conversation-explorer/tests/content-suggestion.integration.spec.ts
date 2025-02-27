import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import { TopicGapAnalyzerService } from '../services/topic-gap-analyzer.service';
import { TopicClusteringService } from '../services/topic-clustering.service';
import { ContentSuggestionController } from '../controllers/content-suggestion.controller';
import { AuthGuard } from '@nestjs/passport';

describe('ContentSuggestion Integration', () => {
  let app: INestApplication;
  let mockTopicGapAnalyzerService: any;
  let mockTopicClusteringService: any;
  let mockCacheService: any;

  beforeAll(async () => {
    // Create mock services
    mockTopicGapAnalyzerService = {
      analyzeTopicGaps: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          gaps: [
            {
              topic: 'subscription',
              gapScore: 0.75,
              relatedTopics: ['pricing', 'plan', 'discount'],
              frequency: 25,
              exampleQuestions: [
                'How do I change my subscription plan?',
                'What are the pricing options for premium plans?',
                'Can I get a discount on annual subscriptions?'
              ],
              suggestedContentAreas: [
                'subscription overview',
                'subscription guide',
                'subscription and pricing',
                'subscription and plan',
                'how to subscription'
              ]
            }
          ],
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          totalTopicsAnalyzed: 50,
          totalConversationsAnalyzed: 100
        });
      })
    };

    mockTopicClusteringService = {
      clusterTopics: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          clusters: [
            {
              centralTopic: 'subscription',
              relatedTopics: ['pricing', 'plan', 'discount', 'payment'],
              strength: 0.85,
              frequency: 30
            }
          ],
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          totalTopics: 50,
          totalConversations: 100
        });
      })
    };

    mockCacheService = {
      getOrSet: jest.fn().mockImplementation((key, factory) => {
        return factory();
      })
    };

    // Create testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ContentSuggestionController],
      providers: [
        ContentSuggestionService,
        {
          provide: TopicGapAnalyzerService,
          useValue: mockTopicGapAnalyzerService
        },
        {
          provide: TopicClusteringService,
          useValue: mockTopicClusteringService
        },
        {
          provide: 'CacheService',
          useValue: mockCacheService
        }
      ],
    })
    .overrideGuard(AuthGuard('jwt'))
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST api/content-suggestions/suggest (with options)', () => {
    return request(app.getHttpServer())
      .post('/api/content-suggestions/suggest')
      .send({
        brandId: 'test-brand',
        options: {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-31T23:59:59Z',
          minGapScore: 0.3,
          contentTypes: ['article', 'FAQ'],
          limit: 5
        }
      })
      .expect(201)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({
          suggestions: expect.any(Array),
          period: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          }),
          totalTopicsAnalyzed: expect.any(Number),
          totalGapsAnalyzed: expect.any(Number)
        }));

        // Verify suggestion structure
        if (res.body.suggestions.length > 0) {
          const suggestion = res.body.suggestions[0];
          expect(suggestion).toEqual(expect.objectContaining({
            title: expect.any(String),
            type: expect.any(String),
            priority: expect.any(Number),
            topics: expect.any(Array),
            gapScore: expect.any(Number),
            estimatedImpact: expect.any(Number),
            exampleQuestions: expect.any(Array),
            suggestedOutline: expect.any(Array)
          }));
        }
      });
  });

  it('/POST api/content-suggestions/suggest (without options)', () => {
    return request(app.getHttpServer())
      .post('/api/content-suggestions/suggest')
      .send({
        brandId: 'test-brand'
      })
      .expect(201)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({
          suggestions: expect.any(Array),
          period: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          }),
          totalTopicsAnalyzed: expect.any(Number),
          totalGapsAnalyzed: expect.any(Number)
        }));
      });
  });

  it('/GET api/content-suggestions/brand/:brandId (with query params)', () => {
    return request(app.getHttpServer())
      .get('/api/content-suggestions/brand/test-brand')
      .query({
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T23:59:59Z',
        minGapScore: 0.3,
        contentTypes: 'article,FAQ',
        limit: 5
      })
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({
          suggestions: expect.any(Array),
          period: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          }),
          totalTopicsAnalyzed: expect.any(Number),
          totalGapsAnalyzed: expect.any(Number)
        }));
      });
  });

  it('/GET api/content-suggestions/brand/:brandId (without query params)', () => {
    return request(app.getHttpServer())
      .get('/api/content-suggestions/brand/test-brand')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual(expect.objectContaining({
          suggestions: expect.any(Array),
          period: expect.objectContaining({
            startDate: expect.any(String),
            endDate: expect.any(String)
          }),
          totalTopicsAnalyzed: expect.any(Number),
          totalGapsAnalyzed: expect.any(Number)
        }));
      });
  });

  it('should use cache service', async () => {
    // Reset mock before this test
    mockCacheService.getOrSet.mockClear();
    
    // First request
    await request(app.getHttpServer())
      .get('/api/content-suggestions/brand/test-brand')
      .expect(200);

    // Verify cache service was called at least once
    expect(mockCacheService.getOrSet).toHaveBeenCalled();
    expect(mockCacheService.getOrSet.mock.calls[0][0]).toContain('content_suggestions:test-brand');
  });

  it('should call topic gap analyzer and topic clustering services', async () => {
    // Reset mocks before this test
    mockTopicGapAnalyzerService.analyzeTopicGaps.mockClear();
    mockTopicClusteringService.clusterTopics.mockClear();
    
    await request(app.getHttpServer())
      .get('/api/content-suggestions/brand/test-brand')
      .expect(200);

    expect(mockTopicGapAnalyzerService.analyzeTopicGaps).toHaveBeenCalled();
    expect(mockTopicClusteringService.clusterTopics).toHaveBeenCalled();
  });

  afterAll(async () => {
    await app.close();
  });
}); 