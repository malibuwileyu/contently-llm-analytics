import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnswerEngineService } from '../services/answer-engine.service';

/**
 * Interface for feature runners
 */
export interface FeatureRunner {
  /**
   * Get the name of the runner
   */
  getName(): string;
  
  /**
   * Check if the feature is enabled
   */
  isEnabled(): Promise<boolean>;
  
  /**
   * Run the feature
   */
  run(context: FeatureContext): Promise<FeatureResult>;
}

/**
 * Context for feature execution
 */
export interface FeatureContext {
  /**
   * ID of the brand
   */
  brandId: string;
  
  /**
   * Additional metadata for the feature
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of feature execution
 */
export interface FeatureResult {
  /**
   * Whether the feature execution was successful
   */
  success: boolean;
  
  /**
   * Result data
   */
  data?: Record<string, unknown>;
  
  /**
   * Error information if execution failed
   */
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Runner for the Answer Engine feature
 */
@Injectable()
export class AnswerEngineRunner implements FeatureRunner {
  constructor(
    private readonly answerEngineService: AnswerEngineService,
    private readonly configService: ConfigService
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
      const mention = await this.answerEngineService.analyzeMention({
        brandId: context.brandId,
        content: context.metadata?.content as string,
        context: context.metadata?.context as any,
        citations: context.metadata?.citations as any[],
      });

      const health = await this.answerEngineService.getBrandHealth(context.brandId);

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