import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FeatureRunner } from '../../modules/answer-engine/runners/answer-engine.runner';
import { AnswerEngineRunner } from '../../modules/answer-engine/runners/answer-engine.runner';

/**
 * Service for registering and managing feature runners
 */
@Injectable()
export class FeatureRegistryService implements OnModuleInit {
  private readonly logger = new Logger(FeatureRegistryService.name);
  private readonly runners: Map<string, FeatureRunner> = new Map();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Initialize the registry by discovering runners
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing feature registry');
    await this.discoverRunners();
  }

  /**
   * Discover runners from the module context
   */
  private async discoverRunners(): Promise<void> {
    try {
      // Get known runner implementations
      const knownRunners = [
        AnswerEngineRunner,
        // Add other runner implementations here
      ];
      
      for (const RunnerClass of knownRunners) {
        try {
          const runner = await this.moduleRef.resolve(RunnerClass);
          if (runner) {
            this.registerRunner(runner);
          }
        } catch (error) {
          this.logger.warn(
            `Could not resolve runner ${RunnerClass.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error discovering runners: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  /**
   * Register a runner
   * @param runner The runner to register
   */
  registerRunner(runner: FeatureRunner): void {
    const name = runner.getName();
    
    if (this.runners.has(name)) {
      this.logger.warn(`Runner with name ${name} already registered, overwriting`);
    }
    
    this.runners.set(name, runner);
    this.logger.log(`Registered runner: ${name}`);
  }

  /**
   * Get a runner by name
   * @param name Name of the runner
   * @returns The runner or undefined if not found
   */
  getRunner(name: string): FeatureRunner | undefined {
    return this.runners.get(name);
  }

  /**
   * Get all registered runners
   * @returns Array of registered runners
   */
  getAllRunners(): FeatureRunner[] {
    return Array.from(this.runners.values());
  }

  /**
   * Get enabled runners
   * @returns Promise resolving to array of enabled runners
   */
  async getEnabledRunners(): Promise<FeatureRunner[]> {
    const enabledRunners: FeatureRunner[] = [];
    
    for (const runner of this.runners.values()) {
      try {
        const isEnabled = await runner.isEnabled();
        if (isEnabled) {
          enabledRunners.push(runner);
        }
      } catch (error) {
        this.logger.error(
          `Error checking if runner ${runner.getName()} is enabled: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined
        );
      }
    }
    
    return enabledRunners;
  }

  /**
   * Check if a runner is registered
   * @param name Name of the runner
   * @returns Whether the runner is registered
   */
  hasRunner(name: string): boolean {
    return this.runners.has(name);
  }

  /**
   * Remove a runner
   * @param name Name of the runner to remove
   * @returns Whether the runner was removed
   */
  removeRunner(name: string): boolean {
    return this.runners.delete(name);
  }

  /**
   * Clear all registered runners
   */
  clearRunners(): void {
    this.runners.clear();
    this.logger.log('Cleared all registered runners');
  }
} 