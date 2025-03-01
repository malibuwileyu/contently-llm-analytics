import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DistributedLockService } from './distributed-lock.service';

/**
 * Interface for cache warm-up providers
 */
export interface CacheWarmupProvider {
  /**
   * Unique key for this provider
   */
  key: string;

  /**
   * Method to warm up the cache
   */
  warmup: () => Promise<void>;

  /**
   * Priority of this provider (higher numbers run first)
   * Default: 0
   */
  priority?: number;
}

/**
 * Service for warming up the cache on application startup
 */
@Injectable()
export class CacheWarmupService {
  private readonly logger = new Logger(CacheWarmupService.name);
  private readonly providers: CacheWarmupProvider[] = [];
  private readonly enabled: boolean;
  private readonly timeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly lockService: DistributedLockService,
  ) {
    this.enabled = this.configService.get<boolean>(
      'cache.warmup.enabled',
      true,
    );
    this.timeout = this.configService.get<number>(
      'cache.warmup.timeout',
      30000,
    );
  }

  /**
   * Register a cache warmup provider
   * @param provider The provider to register
   */
  registerProvider(provider: CacheWarmupProvider): void {
    this.providers.push(provider);
    this.logger.debug(`Registered cache warmup provider: ${provider.key}`);
  }

  /**
   * Get all registered providers
   */
  getProviders(): CacheWarmupProvider[] {
    return [...this.providers].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0),
    );
  }

  /**
   * Warm up the cache
   */
  async warmupCache(): Promise<void> {
    if (!this.enabled) {
      this.logger.log('Cache warmup is disabled');
      return;
    }

    const providers = this.getProviders();
    this.logger.log(`Starting cache warmup with ${providers.length} providers`);

    for (const provider of providers) {
      try {
        await this.lockService.withLock(
          `cache:warmup:${provider.key}`,
          async () => {
            await provider.warmup();
            this.logger.debug(
              `Successfully warmed up cache for: ${provider.key}`,
            );
          },
          { ttl: this.timeout },
        );
      } catch (error) {
        this.logger.error(
          `Failed to warm up cache for ${provider.key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
    }

    this.logger.log('Cache warmup completed');
  }
}
