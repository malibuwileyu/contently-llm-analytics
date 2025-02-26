import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CacheService } from './cache.service';
import { DistributedLockService } from './distributed-lock.service';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for cache warm-up providers
 */
export interface CacheWarmupProvider {
  /**
   * Unique key for this provider
   */
  readonly key: string;
  
  /**
   * Method to warm up the cache
   */
  warmup(): Promise<void>;
  
  /**
   * Priority of this provider (higher numbers run first)
   * Default: 0
   */
  readonly priority?: number;
}

/**
 * Service for warming up the cache on application startup
 */
@Injectable()
export class CacheWarmupService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmupService.name);
  private readonly providers: CacheWarmupProvider[] = [];
  private readonly isEnabled: boolean;
  
  constructor(
    private readonly cacheService: CacheService,
    private readonly lockService: DistributedLockService,
    private readonly configService: ConfigService,
  ) {
    // Check if cache warmup is enabled
    this.isEnabled = this.configService.get<boolean>('redis.enableWarmup', false);
  }
  
  /**
   * Register a cache warmup provider
   * @param provider The provider to register
   */
  registerProvider(provider: CacheWarmupProvider): void {
    this.providers.push(provider);
    this.logger.log(`Registered cache warmup provider: ${provider.key}`);
  }
  
  /**
   * Initialize the cache on module initialization
   */
  async onModuleInit(): Promise<void> {
    if (!this.isEnabled) {
      this.logger.log('Cache warmup is disabled');
      return;
    }
    
    if (this.providers.length === 0) {
      this.logger.log('No cache warmup providers registered');
      return;
    }
    
    this.logger.log('Starting cache warmup...');
    
    try {
      // Sort providers by priority (higher numbers first)
      const sortedProviders = [...this.providers].sort((a, b) => 
        (b.priority || 0) - (a.priority || 0)
      );
      
      // Execute each provider
      for (const provider of sortedProviders) {
        await this.executeWarmupProvider(provider);
      }
      
      this.logger.log('Cache warmup completed successfully');
    } catch (error) {
      this.logger.error(`Cache warmup failed: ${error.message}`, error.stack);
    }
  }
  
  /**
   * Execute a single warmup provider with distributed locking
   * @param provider The provider to execute
   */
  private async executeWarmupProvider(provider: CacheWarmupProvider): Promise<void> {
    const lockKey = `warmup:${provider.key}`;
    
    try {
      // Try to acquire a lock for this provider
      const result = await this.lockService.withLock(
        lockKey,
        async () => {
          this.logger.log(`Warming up cache for provider: ${provider.key}`);
          const startTime = Date.now();
          
          try {
            await provider.warmup();
            const duration = Date.now() - startTime;
            this.logger.log(`Cache warmup for ${provider.key} completed in ${duration}ms`);
            return true;
          } catch (error) {
            this.logger.error(
              `Cache warmup for ${provider.key} failed: ${error.message}`,
              error.stack,
            );
            return false;
          }
        },
        { ttl: 60000 }, // 1 minute lock TTL
      );
      
      if (result === null) {
        this.logger.warn(
          `Could not acquire lock for cache warmup provider: ${provider.key}. ` +
          'Another instance may be performing the warmup.'
        );
      }
    } catch (error) {
      this.logger.error(
        `Error executing cache warmup for ${provider.key}: ${error.message}`,
        error.stack,
      );
    }
  }
  
  /**
   * Get all registered providers
   */
  getProviders(): CacheWarmupProvider[] {
    return [...this.providers];
  }
} 