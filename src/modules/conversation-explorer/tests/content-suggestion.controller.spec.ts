import { Test, TestingModule } from '@nestjs/testing';
import { ContentSuggestionController } from '../controllers/content-suggestion.controller';
import { ContentSuggestionService } from '../services/content-suggestion.service';
import { Logger } from '@nestjs/common';

describe('ContentSuggestionController', () => {
  let controller: ContentSuggestionController;
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
      controllers: [ContentSuggestionController],
      providers: [
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

    controller = module.get<ContentSuggestionController>(ContentSuggestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('suggestContent', () => {
    it('should call service with correct parameters', async () => {
      // Arrange
      const suggestDto = {
        brandId: 'test-brand',
        options: {
          startDate: '2023-01-01T00:00:00Z',
          endDate: '2023-01-31T23:59:59Z',
          minGapScore: 0.3,
          contentTypes: ['article', 'FAQ'],
          limit: 5
        }
      };

      // Act
      await controller.suggestContent(suggestDto);

      // Assert
      expect(mockContentSuggestionService.suggestContent).toHaveBeenCalledWith(
        suggestDto.brandId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minGapScore: suggestDto.options.minGapScore,
          contentTypes: suggestDto.options.contentTypes,
          limit: suggestDto.options.limit
        })
      );
    });

    it('should return formatted results', async () => {
      // Arrange
      const suggestDto = {
        brandId: 'test-brand'
      };

      // Act
      const result = await controller.suggestContent(suggestDto);

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
    });
  });

  describe('getContentSuggestions', () => {
    it('should call service with correct parameters', async () => {
      // Arrange
      const brandId = 'test-brand';
      const startDate = '2023-01-01T00:00:00Z';
      const endDate = '2023-01-31T23:59:59Z';
      const minGapScore = 0.3;
      const contentTypes = 'article,FAQ';
      const limit = 5;

      // Act
      await controller.getContentSuggestions(
        brandId,
        startDate,
        endDate,
        minGapScore,
        contentTypes,
        limit
      );

      // Assert
      expect(mockContentSuggestionService.suggestContent).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          minGapScore,
          contentTypes: ['article', 'FAQ'],
          limit
        })
      );
    });

    it('should handle optional parameters', async () => {
      // Arrange
      const brandId = 'test-brand';

      // Act
      await controller.getContentSuggestions(brandId);

      // Assert
      expect(mockContentSuggestionService.suggestContent).toHaveBeenCalledWith(
        brandId,
        expect.objectContaining({})
      );
    });

    it('should return formatted results', async () => {
      // Arrange
      const brandId = 'test-brand';

      // Act
      const result = await controller.getContentSuggestions(brandId);

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
    });
  });
}); 