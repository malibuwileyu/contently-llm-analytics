import { Logger } from '@nestjs/common';

export interface PromisePoolConfig {
  maxConcurrent: number;
  retryAttempts: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
}

export interface ProcessingState<T, R> {
  items: T[];
  results: R[];
  currentBatch: number;
  processedCount: number;
  errors: Error[];
  startTime: Date;
}

const DEFAULT_CONFIG: PromisePoolConfig = {
  maxConcurrent: 4,
  retryAttempts: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 32000,
};

export class PromisePool {
  private readonly logger = new Logger(PromisePool.name);
  private readonly config: PromisePoolConfig;
  private state: ProcessingState<any, any>;
  private concurrentLimit: number;

  constructor(
    concurrentLimit: number,
    config: Partial<PromisePoolConfig> = {},
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      items: [],
      results: [],
      currentBatch: 0,
      processedCount: 0,
      errors: [],
      startTime: new Date(),
    };
    this.concurrentLimit = concurrentLimit;
  }

  private getBackoffDelay(attempt: number): number {
    const delay = this.config.initialRetryDelay * Math.pow(2, attempt);
    return Math.min(delay, this.config.maxRetryDelay);
  }

  private async processWithRetry(item: any, index: number): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const result = await item;
        this.logger.debug(`Successfully processed item ${index} on attempt ${attempt + 1}`);
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < this.config.retryAttempts - 1) {
          const delay = this.getBackoffDelay(attempt);
          this.logger.warn(
            `Error processing item ${index} on attempt ${attempt + 1}, retrying in ${delay}ms: ${error.message}`,
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Failed to process item after all retries');
  }

  async process<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>
  ): Promise<R[]> {
    const results: R[] = [];
    const inProgress = new Set<Promise<void>>();

    for (const item of items) {
      if (inProgress.size >= this.concurrentLimit) {
        await Promise.race([...inProgress]);
      }

      const promise = (async () => {
        try {
          const result = await processor(item);
          results.push(result);
        } catch (error) {
          console.error('Error processing item:', error);
        } finally {
          inProgress.delete(promise);
        }
      })();

      inProgress.add(promise);
    }

    await Promise.all([...inProgress]);
    return results;
  }

  getState(): ProcessingState<any, any> {
    return { ...this.state };
  }
} 