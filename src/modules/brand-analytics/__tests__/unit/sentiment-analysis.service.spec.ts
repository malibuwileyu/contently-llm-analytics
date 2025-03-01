import { Test, TestingModule } from '@nestjs/testing';
import { SentimentAnalysisService } from '../../services/sentiment-analysis.service';
import { MentionEntity } from '../../entities/mention.entity';

describe('SentimentAnalysisService', () => {
  let service: SentimentAnalysisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SentimentAnalysisService],
    }).compile();

    service = module.get<SentimentAnalysisService>(SentimentAnalysisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSentiment', () => {
    it('should detect positive sentiment correctly', async () => {
      // Arrange
      const mention = createMockMention(
        '1',
        'Nike',
        'Nike shoes are excellent and I love their quality. They are the best athletic shoes.',
      );

      // Act
      const result = await service.analyzeSentiment(mention);

      // Assert
      expect(result.sentimentScore).toBeGreaterThan(0);
      expect(result.sentimentLabel).toBe('positive');
    });

    it('should detect negative sentiment correctly', async () => {
      // Arrange
      const mention = createMockMention(
        '1',
        'Nike',
        'Nike shoes are terrible and I hate their poor quality. They are the worst athletic shoes.',
      );

      // Act
      const result = await service.analyzeSentiment(mention);

      // Assert
      expect(result.sentimentScore).toBeLessThan(0);
      expect(result.sentimentLabel).toBe('negative');
    });

    it('should detect neutral sentiment correctly', async () => {
      // Arrange
      const mention = createMockMention(
        '1',
        'Nike',
        'Nike makes athletic shoes. They have different models and colors.',
      );

      // Act
      const result = await service.analyzeSentiment(mention);

      // Assert
      expect(result.sentimentLabel).toBe('neutral');
    });

    it('should handle mixed sentiment appropriately', async () => {
      // Arrange
      const mention = createMockMention(
        '1',
        'Nike',
        'Nike shoes have good design but poor durability. The quality is excellent but they are overpriced.',
      );

      // Act
      const result = await service.analyzeSentiment(mention);

      // Assert
      expect(result.sentimentScore).toBeDefined();
      // The score could be positive, negative, or neutral depending on the implementation
      // but we can check that the label is set
      expect(['positive', 'negative', 'neutral']).toContain(
        result.sentimentLabel,
      );
    });
  });

  describe('analyzeSentimentBatch', () => {
    it('should analyze multiple mentions correctly', async () => {
      // Arrange
      const mentions = [
        createMockMention('1', 'Nike', 'Nike shoes are excellent.'),
        createMockMention('2', 'Adidas', 'Adidas shoes are terrible.'),
        createMockMention('3', 'Puma', 'Puma makes athletic shoes.'),
      ];

      // Act
      const results = await service.analyzeSentimentBatch(mentions);

      // Assert
      expect(results.length).toBe(3);
      expect(results[0].sentimentLabel).toBe('positive');
      expect(results[1].sentimentLabel).toBe('negative');
      expect(results[2].sentimentLabel).toBe('neutral');
    });

    it('should return empty array for empty input', async () => {
      // Act
      const results = await service.analyzeSentimentBatch([]);

      // Assert
      expect(results).toEqual([]);
    });
  });
});

// Helper function to create test data
function createMockMention(
  id: string,
  text: string,
  context: string,
): MentionEntity {
  const mention = new MentionEntity();
  mention.id = id;
  mention.text = text;
  mention.context = context;
  return mention;
}
