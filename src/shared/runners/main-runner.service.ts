import { Injectable, Logger } from '@nestjs/common';
import {
  FeatureRunner,
  FeatureContext,
  FeatureResult,
} from './feature-runner.interface';

/**
 * Service for managing and executing feature runners
 */
@Injectable()
export class MainRunnerService {
  private readonly logger = new Logger(MainRunnerService.name);
  private readonly runners: FeatureRunner[] = [];

  /**
   * Register a feature runner
   * @param runner The runner to register
   */
  registerRunner(runner: FeatureRunner): void {
    this.runners.push(runner);
    this.logger.log(`Registered runner: ${runner.getName()}`);
  }

  /**
   * Get all registered runners
   * @returns Array of registered runners
   */
  getRunners(): FeatureRunner[] {
    return [...this.runners];
  }

  /**
   * Get enabled runners
   * @returns Promise resolving to array of enabled runners
   */
  async getEnabledRunners(): Promise<FeatureRunner[]> {
    const enabledRunners: FeatureRunner[] = [];

    for (const runner of this.runners) {
      try {
        const isEnabled = await runner.isEnabled();
        if (isEnabled) {
          enabledRunners.push(runner);
        }
      } catch (error) {
        this.logger.error(
          `Error checking if runner ${runner.getName()} is enabled: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    return enabledRunners;
  }

  /**
   * Run all enabled features
   * @param context Feature context
   * @returns Map of runner name to feature result
   */
  async runAll(context: FeatureContext): Promise<Map<string, FeatureResult>> {
    const enabledRunners = await this.getEnabledRunners();
    const results = new Map<string, FeatureResult>();

    this.logger.log(`Running ${enabledRunners.length} enabled runners`);

    await Promise.all(
      enabledRunners.map(async runner => {
        try {
          const startTime = Date.now();
          const result = await runner.run(context);
          const duration = Date.now() - startTime;

          results.set(runner.getName(), result);

          this.logger.debug(
            `Runner ${runner.getName()} completed in ${duration}ms with success=${result.success}`,
          );
        } catch (error) {
          this.logger.error(
            `Error running ${runner.getName()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            error instanceof Error ? error.stack : undefined,
          );

          results.set(runner.getName(), {
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              code: 'RUNNER_ERROR',
              details: {
                runner: runner.getName(),
                timestamp: new Date().toISOString(),
              },
            },
          });
        }
      }),
    );

    return results;
  }

  /**
   * Run a specific feature
   * @param name Name of the feature to run
   * @param context Feature context
   * @returns Feature result
   */
  async runOne(name: string, context: FeatureContext): Promise<FeatureResult> {
    const runner = this.runners.find(r => r.getName() === name);

    if (!runner) {
      return {
        success: false,
        error: {
          message: `Runner ${name} not found`,
          code: 'RUNNER_NOT_FOUND',
        },
      };
    }

    try {
      const isEnabled = await runner.isEnabled();

      if (!isEnabled) {
        return {
          success: false,
          error: {
            message: `Runner ${name} is disabled`,
            code: 'RUNNER_DISABLED',
          },
        };
      }

      const startTime = Date.now();
      const result = await runner.run(context);
      const duration = Date.now() - startTime;

      this.logger.debug(
        `Runner ${name} completed in ${duration}ms with success=${result.success}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Error running ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'RUNNER_ERROR',
          details: {
            runner: name,
            timestamp: new Date().toISOString(),
          },
        },
      };
    }
  }
}
