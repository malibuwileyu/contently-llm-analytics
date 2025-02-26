import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../config/redis.config';
import { randomUUID } from 'crypto';

/**
 * Options for acquiring a distributed lock
 */
export interface LockOptions {
  /**
   * Time-to-live for the lock in milliseconds
   * Default: 10000 (10 seconds)
   */
  ttl?: number;
  
  /**
   * Retry delay in milliseconds between lock acquisition attempts
   * Default: 100
   */
  retryDelay?: number;
  
  /**
   * Maximum number of retry attempts
   * Default: 10
   */
  maxRetries?: number;
}

/**
 * Service for distributed locking using Redis
 * Implements the Redlock algorithm for distributed locks
 */
@Injectable()
export class DistributedLockService implements OnModuleInit {
  private readonly logger = new Logger(DistributedLockService.name);
  private redisClient: RedisClientType | null = null;
  private readonly useRedis: boolean;
  private readonly defaultOptions: Required<LockOptions> = {
    ttl: 10000, // 10 seconds
    retryDelay: 100, // 100ms
    maxRetries: 10, // 10 retries
  };
  private connectionAttempts = 0;
  private readonly maxConnectionAttempts = 5;
  private connectionRetryTimeout = 5000; // 5 seconds
  private isConnecting = false;
  private connectionPromise: Promise<void> | null = null;

  constructor(private configService: ConfigService) {
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
        this.logger.log('Redis client connected for distributed locking');
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
   * Acquires a distributed lock
   * @param lockKey The key to lock
   * @param options Lock options
   * @returns Lock token if successful, null if failed
   */
  async acquireLock(
    lockKey: string,
    options?: LockOptions,
  ): Promise<string | null> {
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      this.logger.warn('Distributed locking unavailable: Redis not connected');
      return null;
    }

    const opts = { ...this.defaultOptions, ...options };
    const lockToken = randomUUID();
    const lockResource = `lock:${lockKey}`;
    
    let retries = 0;
    
    while (retries < opts.maxRetries) {
      try {
        // Try to set the lock with NX (only if it doesn't exist)
        const result = await this.redisClient!.set(
          lockResource,
          lockToken,
          {
            NX: true,
            PX: opts.ttl,
          },
        );
        
        if (result === 'OK') {
          this.logger.debug(`Acquired lock for ${lockKey} with token ${lockToken}`);
          return lockToken;
        }
        
        // Lock acquisition failed, wait and retry
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        retries++;
      } catch (error) {
        this.logger.error(`Error acquiring lock for ${lockKey}: ${error.message}`, error.stack);
        
        // Try to reconnect if there's a connection issue
        if (error.message.includes('connection') || error.message.includes('network')) {
          try {
            await this.initRedisClient();
          } catch (reconnectError) {
            this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
            return null;
          }
        } else {
          return null;
        }
      }
    }
    
    this.logger.warn(`Failed to acquire lock for ${lockKey} after ${retries} retries`);
    return null;
  }

  /**
   * Releases a distributed lock
   * @param lockKey The key to unlock
   * @param lockToken The token received when acquiring the lock
   * @returns true if released successfully, false otherwise
   */
  async releaseLock(lockKey: string, lockToken: string): Promise<boolean> {
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      this.logger.warn('Distributed locking unavailable: Redis not connected');
      return false;
    }

    const lockResource = `lock:${lockKey}`;
    
    try {
      // Use Lua script to ensure we only delete the lock if it matches our token
      const script = `
        if redis.call("GET", KEYS[1]) == ARGV[1] then
          return redis.call("DEL", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await this.redisClient!.eval(
        script,
        {
          keys: [lockResource],
          arguments: [lockToken],
        },
      );
      
      const success = result === 1;
      if (success) {
        this.logger.debug(`Released lock for ${lockKey} with token ${lockToken}`);
      } else {
        this.logger.warn(`Failed to release lock for ${lockKey} with token ${lockToken} (lock not owned or expired)`);
      }
      
      return success;
    } catch (error) {
      this.logger.error(`Error releasing lock for ${lockKey}: ${error.message}`, error.stack);
      
      // Try to reconnect if there's a connection issue
      if (error.message.includes('connection') || error.message.includes('network')) {
        try {
          await this.initRedisClient();
        } catch (reconnectError) {
          this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
        }
      }
      
      return false;
    }
  }

  /**
   * Executes a function with a distributed lock
   * @param lockKey The key to lock
   * @param fn The function to execute while holding the lock
   * @param options Lock options
   * @returns The result of the function or null if lock acquisition failed
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T | null> {
    const lockToken = await this.acquireLock(lockKey, options);
    if (!lockToken) {
      // If we're in development mode and Redis is not available, execute the function anyway
      if (process.env.NODE_ENV === 'development' && !this.useRedis) {
        this.logger.warn('Executing function without distributed lock in development mode');
        try {
          return await fn();
        } catch (error) {
          this.logger.error(`Error executing function without lock: ${error.message}`, error.stack);
          throw error;
        }
      }
      return null;
    }
    
    try {
      return await fn();
    } finally {
      await this.releaseLock(lockKey, lockToken);
    }
  }

  /**
   * Checks if a lock exists
   * @param lockKey The key to check
   * @returns true if locked, false otherwise
   */
  async isLocked(lockKey: string): Promise<boolean> {
    const isConnected = await this.ensureConnection();
    if (!isConnected) {
      this.logger.warn('Distributed locking unavailable: Redis not connected');
      return false;
    }
    
    try {
      const lockResource = `lock:${lockKey}`;
      const result = await this.redisClient!.exists(lockResource);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking lock for ${lockKey}: ${error.message}`, error.stack);
      
      // Try to reconnect if there's a connection issue
      if (error.message.includes('connection') || error.message.includes('network')) {
        try {
          await this.initRedisClient();
        } catch (reconnectError) {
          this.logger.error(`Failed to reconnect to Redis: ${reconnectError.message}`);
        }
      }
      
      return false;
    }
  }
} 