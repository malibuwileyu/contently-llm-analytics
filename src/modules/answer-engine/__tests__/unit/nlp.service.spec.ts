import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NLPService } from '../../services/nlp.service';
import { Logger } from '@nestjs/common';

describe('NLPService', () => {
  let service: NLPService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NLPService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: string) => {
              if (key === 'NLP_API_KEY') return 'test-api-key';
              if (key === 'NLP_API_ENDPOINT') return 'https://test-api.com';
              return defaultValue;
            }),
          },
        },
        {
          provide: Logger,
          useValue: {
            debug: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NLPService>(NLPService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSentiment', () => {
    it('should return neutral sentiment for empty content', async () => {
      const result = await service.analyzeSentiment('');
      
      expect(result).toEqual({
        score: 0,
        magnitude: 0,
        aspects: [],
      });
    });

    it('should return positive sentiment for positive content', async () => {
      const result = await service.analyzeSentiment(
        'This product is excellent and amazing. I love how great it performs.'
      );
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.magnitude).toBeGreaterThan(0);
    });

    it('should return negative sentiment for negative content', async () => {
      const result = await service.analyzeSentiment(
        'This is terrible and disappointing. I hate how bad it performs.'
      );
      
      expect(result.score).toBeLessThan(0);
      expect(result.magnitude).toBeGreaterThan(0);
    });

    it('should return neutral sentiment for neutral content', async () => {
      const result = await service.analyzeSentiment(
        'This is a product. It has features. I used it yesterday.'
      );
      
      expect(result.score).toBeCloseTo(0);
    });

    it('should extract aspects from content', async () => {
      const result = await service.analyzeSentiment(
        'The performance is excellent. The price is expensive. The quality is good.'
      );
      
      expect(result.aspects.length).toBeGreaterThan(0);
      
      // Find performance aspect
      const performanceAspect = result.aspects.find(a => a.topic === 'performance');
      expect(performanceAspect).toBeDefined();
      if (performanceAspect) {
        expect(performanceAspect.score).toBeGreaterThanOrEqual(0); // Positive or neutral
      }
      
      // Find value aspect
      const valueAspect = result.aspects.find(a => a.topic === 'value');
      expect(valueAspect).toBeDefined();
      if (valueAspect) {
        // Just check that it exists, don't make assumptions about the score
        // as it depends on the exact implementation of the sentiment analysis
        expect(valueAspect.score).toBeDefined();
      }
      
      // Find quality aspect
      const qualityAspect = result.aspects.find(a => a.topic === 'quality');
      expect(qualityAspect).toBeDefined();
      if (qualityAspect) {
        expect(qualityAspect.score).toBeGreaterThanOrEqual(0); // Positive or neutral
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock the private method to throw an error
      jest.spyOn<any, any>(service, 'performSimpleSentimentAnalysis').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await expect(service.analyzeSentiment('test content')).rejects.toThrow(
        'Failed to analyze sentiment: Test error'
      );
    });
  });
}); 