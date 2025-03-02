import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnswerEngineService } from '../services/answer-engine.service';
import { ContextDto } from '../dto/analyze-content.dto';
import {
  FeatureRunner,
  FeatureContext,
  FeatureResult,
} from '../../../shared/runners/feature-runner.interface';

/**
 * Runner for the Answer Engine feature
 */
@Injectable()
export class AnswerEngineRunner implements FeatureRunner {
  constructor(
    private readonly answerEngineService: AnswerEngineService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get the name of the runner
   */
  getName(): string {
    return 'answer-engine';
  }

  /**
   * Check if the feature is enabled
   */
  async isEnabled(): Promise<boolean> {
    return this.configService.get('features.answerEngine.enabled', true);
  }

  /**
   * Run the Answer Engine feature
   * @param context Feature context
   * @returns Feature result
   */
  async run(context: FeatureContext): Promise<FeatureResult> {
    try {
      // Check if content is missing
      if (!context.metadata?.content) {
        return {
          success: false,
          error: {
            message: 'Missing content in request',
            code: 'MISSING_CONTENT',
            details: {
              brandId: context.brandId,
              timestamp: new Date().toISOString(),
            },
          },
        };
      }

      const mention = await this.answerEngineService.analyzeMention({
        brandId: context.brandId,
        content: context.metadata?.content as string,
        context: context.metadata?.context as unknown as ContextDto,
        citations: context.metadata?.citations as Array<{
          source: string;
          metadata?: Record<string, unknown>;
        }>,
      });

      const health = await this.answerEngineService.getBrandHealth(
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
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'ANSWER_ENGINE_ERROR',
          details: {
            brandId: context.brandId,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
  }
}
