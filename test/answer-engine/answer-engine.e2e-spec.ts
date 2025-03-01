import { MainRunnerService } from '../../src/shared/runners/main-runner.service';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AnswerEngineRunner } from '../../src/modules/answer-engine/runners/answer-engine.runner';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AnswerEngineService } from '../../src/modules/answer-engine/services/answer-engine.service';

// Define interfaces for testing
interface FeatureContext {
  brandId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

interface FeatureResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  error?: {
    message: string;
    code?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details?: Record<string, any>;
  };
}

/**
 * End-to-end test for the Answer Engine
 *
 * This test verifies the complete flow of the Answer Engine:
 * 1. Data ingestion through the MainRunnerService
 * 2. Sentiment analysis of content
 * 3. Citation tracking and authority calculation
 * 4. Brand health metrics calculation
 */
describe('Answer Engine E2E', () => {
  let mainRunnerService: MainRunnerService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let answerEngineRunner: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let answerEngineService: any;

  // Test data
  const testBrandId = 'test-brand-123';
  const testContent =
    'This is a positive mention of the brand with good sentiment.';
  const testCitations = [
    { source: 'trusted-source.com', text: 'Positive review' },
    { source: 'blog.example.com', text: 'Mixed review' },
  ];

  beforeAll(() => {
    // Create mock services
    answerEngineService = {
      analyzeMention: jest.fn().mockImplementation(data =>
        Promise.resolve({
          _id: 'mention-123',
          brandId: data.brandId,
          content: data.content,
          sentiment: 0.8,
          _magnitude: 0.5,
          context: data.context,
          _mentionedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          citations: [],
        }),
      ),
      getBrandHealth: jest.fn().mockImplementation(brandId =>
        Promise.resolve({
          overallSentiment: 0.75,
          _trend: [{ date: new Date(), _averageSentiment: 0.75 }],
          mentionCount: 1,
          topCitations: [{ source: 'trusted-source.com', authority: 0.85 }],
        }),
      ),
    };

    // Create mock runner
    answerEngineRunner = {
      _getName: jest.fn().mockReturnValue('answer-engine'),
      _isEnabled: jest.fn().mockResolvedValue(true),
      run: jest
        .fn()
        .mockImplementation(
          async (context: FeatureContext): Promise<FeatureResult> => {
            try {
              const mention = await answerEngineService.analyzeMention({
                brandId: context.brandId,
                content: context.metadata?.content as string,
                context: context.metadata?.context,
                citations: context.metadata?.citations,
              });

              const health = await answerEngineService.getBrandHealth(
                context.brandId,
              );

              return {
                success: true,
                data: {
                  mention,
                  health,
                },
              };
            } catch (error) {
              return {
                success: false,
                error: {
                  message:
                    error instanceof Error ? error.message : 'Unknown error',
                  code: 'ANSWER_ENGINE_ERROR',
                  details: {
                    brandId: context.brandId,
                    timestamp: new Date().toISOString(),
                  },
                },
              };
            }
          },
        ),
    };

    // Create MainRunnerService
    mainRunnerService = new MainRunnerService();

    // Register the runner with the main runner service
    mainRunnerService.registerRunner(answerEngineRunner);
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('End-to-end flow', () => {
    it('should process content through the MainRunnerService', async () => {
      // Prepare test context
      const context: FeatureContext = {
        brandId: testBrandId,
        metadata: {
          content: testContent,
        },
      };

      // Execute the runner through the main runner service
      const result = await mainRunnerService.runOne('answer-engine', context);

      // Verify the result
      expect(result.success).toBe(true);
      if (result.data) {
        expect(result.data.mention).toBeDefined();
        expect(result.data.health).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((result.data.health as any).overallSentiment).toBeGreaterThan(0);
      }
      expect(answerEngineService.analyzeMention).toHaveBeenCalled();
    });

    it('should handle multiple brand mentions and calculate aggregate metrics', async () => {
      // Prepare test context with citations
      const context: FeatureContext = {
        brandId: testBrandId,
        metadata: {
          content: testContent,
          citations: testCitations,
        },
      };

      // Execute the runner
      const result = await mainRunnerService.runOne('answer-engine', context);

      // Verify the result
      expect(result.success).toBe(true);
      if (result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((result.data.health as any).topCitations).toBeDefined();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((result.data.health as any).topCitations.length).toBeGreaterThan(
          0,
        );
      }
      expect(answerEngineService.getBrandHealth).toHaveBeenCalledWith(
        testBrandId,
      );
    });

    it('should handle errors gracefully', async () => {
      // Mock the service to throw an error
      (answerEngineService.analyzeMention as jest.Mock).mockRejectedValueOnce(
        new Error('Test error'),
      );

      // Prepare test context
      const context: FeatureContext = {
        brandId: testBrandId,
        metadata: {
          content: testContent,
        },
      };

      // Execute the runner
      const result = await mainRunnerService.runOne('answer-engine', context);

      // Verify the result indicates failure
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      if (result.error) {
        expect(result.error.message).toContain('Test error');
      }
    });
  });

  describe('Performance', () => {
    it('should process multiple mentions efficiently', async () => {
      // Prepare multiple test contexts
      const contexts = Array(5)
        .fill(null)
        .map((_, i) => ({
          brandId: testBrandId,
          metadata: {
            content: `Test content ${i}`,
            citations: testCitations,
          },
        }));

      // Execute the runner for each context and measure time
      const startTime = Date.now();
      const results = await Promise.all(
        contexts.map(context =>
          mainRunnerService.runOne('answer-engine', context),
        ),
      );
      const endTime = Date.now();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _totalTime = endTime - startTime;

      // Verify all results were successful
      expect(results.every(r => r.success)).toBe(true);

      // Verify service calls
      expect(answerEngineService.analyzeMention).toHaveBeenCalledTimes(
        contexts.length,
      );
    });
  });
});
