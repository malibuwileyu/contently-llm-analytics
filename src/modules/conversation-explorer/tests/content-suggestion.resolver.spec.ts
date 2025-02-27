import { Test, TestingModule } from '@nestjs/testing';
import { ContentSuggestionResolver } from '../resolvers/content-suggestion.resolver';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import { Logger } from '@nestjs/common';

describe('ContentSuggestionResolver', () => {
  let resolver: ContentSuggestionResolver;
  let mockContentSuggestionService: any;

  beforeEach(async () => {
    // Create mock content suggestion service
    mockContentSuggestionService = {
      suggestContent: jest.fn().mockImplementation((brandId, options) => {
        return Promise.resolve({
          suggestions: [
            {
              title: 'Understanding Subscription Plans',
              type: 'article',
              priority: 8.5,
              topics: ['subscription', 'plan', 'pricing'],
              gapScore: 0.75,
              estimatedImpact: 8,
              exampleQuestions: [
                'How do I change my subscription plan?',
                'What are the pricing options for premium plans?'
              ],
              suggestedOutline: [
                'Introduction to subscription plans',
                'Comparing different plan tiers',
                'How to upgrade or downgrade',
                'Conclusion and next steps'
              ]
            }
          ],
          period: {
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-01-31')
          },
          totalTopicsAnalyzed: 50,
          totalGapsAnalyzed: 15
        });
      })
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentSuggestionResolver,
        {
          provide: ContentSuggestionService,
          useValue: mockContentSuggestionService
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn()
          }
        }
      ],
    }).compile();

    resolver = module.get<ContentSuggestionResolver>(ContentSuggestionResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('getContentSuggestions', () => {
    it('should call service with correct parameters', async () => {
      // Arrange
      const brandId = 'test-brand';
      const options = {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-01-31T23:59:59Z',
        minGapScore: 0.3,
        contentTypes: ['article', 'FAQ'],
        limit: 5
      };

      // Act
      await resolver.getContentSuggestions(brandId, options);

      // Assert
      expect(mockContentSuggestionService.suggestContent).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minGapScore: options.minGapScore,
          contentTypes: options.contentTypes,
          limit: options.limit
        })
      );
    });

    it('should handle null options', async () => {
      // Arrange
      const brandId = 'test-brand';

      // Act
      await resolver.getContentSuggestions(brandId);

      // Assert
      expect(mockContentSuggestionService.suggestContent).toHaveBeenCalledWith(
        brandId,
        undefined
      );
    });

    it('should return formatted results', async () => {
      // Arrange
      const brandId = 'test-brand';

      // Act
      const result = await resolver.getContentSuggestions(brandId);

      // Assert
      expect(result).toEqual(expect.objectContaining({
        suggestions: expect.any(Array),
        period: expect.objectContaining({
          startDate: expect.any(String),
          endDate: expect.any(String)
        }),
        totalTopicsAnalyzed: expect.any(Number),
        totalGapsAnalyzed: expect.any(Number)
      }));

      // Check that dates are converted to ISO strings
      expect(typeof result.period.startDate).toBe('string');
      expect(typeof result.period.endDate).toBe('string');
    });

    it('should transform service response correctly', async () => {
      // Arrange
      const brandId = 'test-brand';
      const mockServiceResponse = {
        suggestions: [
          {
            title: 'Test Title',
            type: 'article',
            priority: 10,
            topics: ['test'],
            gapScore: 0.9,
            estimatedImpact: 9,
            exampleQuestions: ['Test question?'],
            suggestedOutline: ['Test outline']
          }
        ],
        period: {
          startDate: new Date('2023-01-01'),
          endDate: new Date('2023-01-31')
        },
        totalTopicsAnalyzed: 100,
        totalGapsAnalyzed: 25
      };

      mockContentSuggestionService.suggestContent.mockResolvedValueOnce(mockServiceResponse);

      // Act
      const result = await resolver.getContentSuggestions(brandId);

      // Assert
      expect(result).toEqual({
        suggestions: mockServiceResponse.suggestions,
        period: {
          startDate: mockServiceResponse.period.startDate.toISOString(),
          endDate: mockServiceResponse.period.endDate.toISOString()
        },
        totalTopicsAnalyzed: mockServiceResponse.totalTopicsAnalyzed,
        totalGapsAnalyzed: mockServiceResponse.totalGapsAnalyzed
      });
    });
  });
}); 