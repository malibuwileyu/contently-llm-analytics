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
  private inMemoryCache: Map<string, { value: any; expiry: number | null }> = new Map();

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Check if we're using Redis or in-memory cache
    const redisConfig = this.configService.get<RedisConfig>('redis');
    this.useRedis = !!(redisConfig?.host && process.env.NODE_ENV !== 'test');
  }

  async onModuleInit() {
    if (this.useRedis) {
      await this.initRedisClient();
    }
  }

  private async initRedisClient(): Promise<void> {
    // If already connecting, return the existing promise
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

      // Close existing client if it exists
      if (this.redisClient) {
        try {
          await this.redisClient.quit();
        } catch (error) {
          this.logger.warn(`Error closing existing Redis client: ${error.message}`);
        }
      }

      this.redisClient = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          connectTimeout: 10000, // 10 seconds
          reconnectStrategy: (retries) => {
            // Maximum retry delay is 10 seconds
            const delay = Math.min(retries * 100, 10000);
            return delay;
          },
        },
        password: redisConfig.password,
        database: redisConfig.db,
      });

      this.redisClient.on('error', (err) => {
        this.logger.error(`Redis client error: ${err.message}`, err.stack);
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis client connected');
        this.connectionAttempts = 0; // Reset connection attempts on successful connection
      });

      this.redisClient.on('reconnecting', () => {
        this.logger.log('Redis client reconnecting...');
      });

      await this.redisClient.connect();
    } catch (error) {
      this.logger.error(`Failed to initialize Redis client: ${error.message}`, error.stack);
      this.redisClient = null;
      
      // Retry connection if we haven't exceeded max attempts
      this.connectionAttempts++;
      if (this.connectionAttempts < this.maxConnectionAttempts) {
        this.logger.log(`Retrying Redis connection (attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}) in ${this.connectionRetryTimeout}ms`);
        await new Promise(resolve => setTimeout(resolve, this.connectionRetryTimeout));
        await this.connectToRedis();
      } else {
        this.logger.warn(`Max Redis connection attempts (${this.maxConnectionAttempts}) reached. Giving up.`);
      }
    }
  }

  /**
   * Ensures Redis client is connected before performing operations
   * @returns true if connected, false otherwise
   */
  private async ensureConnection(): Promise<boolean> {
    if (!this.useRedis) {
      return false;
    }

    if (!this.redisClient) {
      try {
        await this.initRedisClient();
      } catch (error) {
        this.logger.error(`Failed to initialize Redis client: ${error.message}`);
        return false;
      }
    }

    if (!this.redisClient?.isOpen) {
      try {
        await this.redisClient?.connect();
      } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
        return false;
      }
    }

    return !!this.redisClient?.isOpen;
  }

  /**
   * Fallback to in-memory cache when Redis is unavailable
   * @param key Cache key
   * @returns Cached value or null
   */
  private getFromMemory<T>(key: string): T | null {
    const item = this.inMemoryCache.get(key);
    if (!item) {
      return null;
    }

    // Check if the item has expired
    if (item.expiry !== null && item.expiry < Date.now()) {
      this.inMemoryCache.delete(key);
      return null;
    }

    return item.value as T;
  }

  /**
   * Store value in in-memory cache when Redis is unavailable
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds
   */
  private setInMemory<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.inMemoryCache.set(key, { value, expiry });
  }

  /**
   * Delete value from in-memory cache
   * @param key Cache key
   */
  private delFromMemory(key: string): void {
    this.inMemoryCache.delete(key);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Try to use cache manager (Redis or in-memory)
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`, error.stack);
      
      // Fallback to in-memory cache if cache manager fails
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Falling back to in-memory cache for key ${key}`);
        return this.getFromMemory<T>(key);
      }
      
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // Try to use cache manager (Redis or in-memory)
      await this.cacheManager.set(key, value, ttl);
      
      // Also store in our fallback in-memory cache
      if (process.env.NODE_ENV === 'development') {
        this.setInMemory(key, value, ttl);
      }
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`, error.stack);
      
      // Fallback to in-memory cache if cache manager fails
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Falling back to in-memory cache for key ${key}`);
        this.setInMemory(key, value, ttl);
      }
    }
  }

  async del(key: string): Promise<void> {
    try {
      // Try to use cache manager (Redis or in-memory)
      await this.cacheManager.del(key);
      
      // Also delete from our fallback in-memory cache
      if (process.env.NODE_ENV === 'development') {
        this.delFromMemory(key);
      }
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`, error.stack);
      
      // Fallback to in-memory cache if cache manager fails
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Falling back to in-memory cache for key ${key}`);
        this.delFromMemory(key);
      }
    }
  }

  /**
   * Gets a value from cache or calls the factory function to generate it
   * @param key Cache key
   * @param factory Function to generate value if not in cache
   * @param ttl Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Deletes all keys matching a pattern (Redis only)
   * @param pattern Pattern to match (e.g., "user:*")
   * @returns Number of keys deleted
   */
  async delByPattern(pattern: string): Promise<number> {
    // Ensure Redis connection
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      this.logger.warn('Pattern deletion only supported with Redis, which is not available');
      
      // In development mode, try to match pattern against in-memory cache
      if (process.env.NODE_ENV === 'development') {
        let count = 0;
        const regex = new RegExp(pattern.replace('*', '.*'));
        
        for (const key of this.inMemoryCache.keys()) {
          if (regex.test(key)) {
            this.inMemoryCache.delete(key);
            count++;
          }
        }
        
        this.logger.log(`Deleted ${count} keys matching pattern: ${pattern} from in-memory cache`);
        return count;
      }
      
      return 0;
    }

    try {
      const keys = await this.redisClient!.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const pipeline = this.redisClient!.multi();
      keys.forEach(key => pipeline.del(key));
      const results = await pipeline.exec();
      
      const deletedCount = results ? results.length : 0;
      this.logger.log(`Deleted ${deletedCount} keys matching pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Error deleting keys by pattern ${pattern}: ${error.message}`, error.stack);
      
      // Try to reconnect if there's a connection issue
      if (error.message.includes('connection') || error.message.includes('network')) {
        try {
          await this.initRedisClient();
        } catch (reconnectError) {
          this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
        }
      }
      
      return 0;
    }
  }

  /**
   * Checks if the cache is healthy
   * @returns True if the cache is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const testKey = `health:${Date.now()}`;
      await this.set(testKey, 'OK', 10);
      const result = await this.get(testKey);
      await this.del(testKey);
      return result === 'OK';
    } catch (error) {
      this.logger.error(`Cache health check failed: ${error.message}`, error.stack);
      
      // In development mode, check if in-memory cache is working
      if (process.env.NODE_ENV === 'development') {
        try {
          const testKey = `health:${Date.now()}`;
          this.setInMemory(testKey, 'OK', 10);
          const result = this.getFromMemory(testKey);
          this.delFromMemory(testKey);
          
          if (result === 'OK') {
            this.logger.log('In-memory cache is healthy, but Redis is not available');
            return true;
          }
        } catch (memoryError) {
          this.logger.error(`In-memory cache health check failed: ${memoryError.message}`);
        }
      }
      
      return false;
    }
  }

  /**
   * Gets cache statistics (Redis only)
   * @returns Cache statistics or null if not using Redis
   */
  async getStats(): Promise<Record<string, any> | null> {
    // Ensure Redis connection
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      // In development mode, return in-memory cache stats
      if (process.env.NODE_ENV === 'development') {
        return {
          type: 'in-memory',
          size: this.inMemoryCache.size,
          timestamp: new Date().toISOString(),
        };
      }
      
      return null;
    }

    try {
      const info = await this.redisClient!.info();
      const dbSize = await this.redisClient!.dbSize();
      
      return {
        type: 'redis',
        dbSize,
        info: this.parseRedisInfo(info),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting cache stats: ${error.message}`, error.stack);
      
      // Try to reconnect if there's a connection issue
      if (error.message.includes('connection') || error.message.includes('network')) {
        try {
          await this.initRedisClient();
        } catch (reconnectError) {
          this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
        }
      }
      
      return null;
    }
  }

  /**
   * Flushes the entire cache
   * @returns True if successful
   */
  async flushAll(): Promise<boolean> {
    try {
      // Ensure Redis connection
      const isConnected = await this.ensureConnection();
      if (isConnected) {
        await this.redisClient!.flushDb();
      } else {
        // For in-memory cache, we can't flush the cache-manager directly
        this.logger.warn('Redis not available, flushing in-memory cache only');
      }
      
      // Always clear our fallback in-memory cache
      this.inMemoryCache.clear();
      
      return true;
    } catch (error) {
      this.logger.error(`Error flushing cache: ${error.message}`, error.stack);
      
      // Try to reconnect if there's a connection issue
      if (error.message.includes('connection') || error.message.includes('network')) {
        try {
          await this.initRedisClient();
        } catch (reconnectError) {
          this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
        }
      }
      
      // Clear in-memory cache even if Redis flush fails
      this.inMemoryCache.clear();
      
      return false;
    }
  }

  /**
   * Refreshes a cached value by key
   * @param key Cache key
   * @param factory Function to generate new value
   * @param ttl Time to live in seconds
   */
  async refresh<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      const value = await factory();
      await this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error refreshing cache key ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Parses Redis INFO command output into a structured object
   * @param info Redis INFO output
   * @returns Structured object
   */
  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const sections = info.split('#');

    sections.forEach(section => {
      const lines = section.trim().split('\r\n');
      if (lines.length > 1) {
        const sectionName = lines[0].toLowerCase().replace(/\s+/g, '_');
        result[sectionName] = {};

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (line && line.includes(':')) {
            const [key, value] = line.split(':');
            result[sectionName][key] = this.parseRedisValue(value);
          }
        }
      }
    });

    return result;
  }

  /**
   * Parses Redis value strings into appropriate types
   * @param value Redis value string
   * @returns Parsed value
   */
  private parseRedisValue(value: string): any {
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    
    if (value.toLowerCase() === 'true') {
      return true;
    }
    
    if (value.toLowerCase() === 'false') {
      return false;
    }
    
    return value;
  }
}
