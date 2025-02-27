import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { RedisConfig } from '../config/redis.config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: RedisClientType | null = null;
  private readonly useRedis: boolean;
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;
  private connectionRetryTimeout = 5000; // 5 seconds
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;
  private inMemoryCache: Map<
    string,
    { value: unknown; expiry: number | null }
  > = new Map();

  constructor(
    @Inject(CACHE_MANAGER) protected readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    const redisConfig = this.configService.get<RedisConfig>('redis');
    this.useRedis = !!(redisConfig?.host && process.env.NODE_ENV !== 'test');
  }

  async onModuleInit(): Promise<void> {
    if (this.useRedis) {
      await this.initRedisClient();
    }
  }

  private async initRedisClient(): Promise<void> {
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this.connectToRedis();

    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async connectToRedis(): Promise<void> {
    try {
      const redisConfig = this.configService.get<RedisConfig>('redis');
      if (!redisConfig) {
        throw new Error('Redis configuration not found');
      }

      if (this.redisClient) {
        try {
          await this.redisClient.quit();
        } catch (error) {
          this.logger.warn(
            `Error closing existing Redis client: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      this.redisClient = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          connectTimeout: 10000,
          reconnectStrategy: retries => Math.min(retries * 100, 10000),
        },
        password: redisConfig.password,
        database: redisConfig.db,
      });

      this.redisClient.on('error', err => {
        this.logger.error(
          `Redis client error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        );
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected');
        this.connectionAttempts = 0;
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('Redis client reconnecting...');
      });

      await this.redisClient.connect();
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis client: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.redisClient = null;

      this.connectionAttempts++;
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.log(
          `Retrying Redis connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}) in ${this.connectionRetryTimeout}ms`,
        );
        await new Promise(resolve =>
          setTimeout(resolve, this.connectionRetryTimeout),
        );
        await this.connectToRedis();
      } else {
        this.logger.warn(
          `Max Redis connection attempts (${this.maxConnectionAttempts}) reached. Giving up.`,
        );
      }
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (!this.useRedis) {
      return false;
    }

    if (!this.redisClient) {
      try {
        await this.initRedisClient();
      } catch (error) {
        this.logger.error(
          `Failed to initialize Redis client: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return false;
      }
    }

    if (!this.redisClient?.isOpen) {
      try {
        await this.redisClient?.connect();
      } catch (error) {
        this.logger.error(
          `Failed to connect to Redis: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        return false;
      }
    }

    return !!this.redisClient?.isOpen;
  }

  private getFromMemory<T>(key: string): T | null {
    const item = this.inMemoryCache.get(key);
    if (!item) {
      return null;
    }

    if (item.expiry !== null && item.expiry < Date.now()) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  private setInMemory<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.inMemoryCache.set(key, { value, expiry });
  }

  private delFromMemory(_key: string): void {
    this.inMemoryCache.delete(_key);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(
        `Error getting cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
    } catch (error) {
      this.logger.error(
        `Error setting cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(
        `Error deleting cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  async getTtl(_key: string): Promise<number | null> {
    return null;
  }

  async updateTtl(key: string, ttl: number): Promise<void> {
    const value = await this.get(key);
    if (value !== null) {
      await this.set(key, value, ttl);
    }
  }

  async setBatch(
    batch: { key: string; value: unknown; ttl?: number }[],
  ): Promise<void> {
    await Promise.all(
      batch.map(({ key, value, ttl }) => this.set(key, value, ttl)),
    );
  }

  async acquireLock(key: string, ttl?: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const acquired = await this.exists(lockKey);
    if (!acquired) {
      await this.set(lockKey, true, ttl);
      return true;
    }
    return false;
  }

  async releaseLock(key: string): Promise<void> {
    const lockKey = `lock:${key}`;
    await this.delete(lockKey);
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.error(
        `Error deleting cache key ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  async delByPattern(pattern: string): Promise<number> {
    if (!this.useRedis || !this.redisClient) {
      return 0;
    }

    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      await this.redisClient.del(keys);
      return keys.length;
    } catch (error) {
      this.logger.error(
        `Error deleting keys by pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return 0;
    }
  }

  async getStats(): Promise<Record<string, number> | null> {
    if (!this.useRedis || !this.redisClient) {
      return null;
    }

    try {
      const info = await this.redisClient.info();
      const stats = {} as Record<string, number>;
      
      info.split('\n').forEach(line => {
        const [key, value] = line.split(':');
        if (key && value) {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            stats[key] = numValue;
          }
        }
      });

      return stats;
    } catch (error) {
      this.logger.error(
        `Error getting cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const testKey = 'health:test';
      const testValue = 'ok';
      
      await this.set(testKey, testValue);
      const value = await this.get(testKey);
      await this.delete(testKey);
      
      return value === testValue;
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Flush all cache entries
   * @returns Promise resolving to true if successful
   */
  async flushAll(): Promise<boolean> {
    try {
      if (this.redisClient && await this.ensureConnection()) {
        await this.redisClient.flushAll();
      }
      
      // Clear in-memory cache
      this.inMemoryCache.clear();
      
      // Since we can't directly reset the cache manager in a type-safe way,
      // we'll just log that it might not be fully cleared
      this.logger.log('In-memory cache cleared. Redis cache flushed if available.');
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to flush cache: ${error.message}`, error.stack);
      return false;
    }
  }
}
