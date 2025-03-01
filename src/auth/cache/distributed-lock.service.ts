import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../../config/redis.config';
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

    // Initialize Redis client immediately in test mode
    if (process.env.NODE_ENV === 'test') {
      this.redisClient = createClient({
        socket: {
          host: 'localhost',
          port: 6379,
        },
      });
    }
  }

  async onModuleInit(): Promise<void> {
    if (this.useRedis || process.env.NODE_ENV === 'test') {
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
      // Close existing client if it exists
      if (this.redisClient?.isOpen) {
        try {
          await this.redisClient.quit();
        } catch (error) {
          this.logger.warn(
            `Error closing existing Redis client: ${error.message}`,
          );
        }
      }

      if (!this.redisClient) {
        const redisConfig = this.configService.get<RedisConfig>('redis');
        if (!redisConfig && process.env.NODE_ENV !== 'test') {
          throw new Error('Redis configuration not found');
        }

        if (process.env.NODE_ENV === 'test') {
          this.redisClient = createClient({
            socket: {
              host: 'localhost',
              port: 6379,
            },
          });
        } else {
          this.redisClient = createClient({
            socket: {
              host: redisConfig!.host,
              port: redisConfig!.port,
              connectTimeout: 10000,
              reconnectStrategy: retries => {
                const delay = Math.min(retries * 100, 10000);
                return delay;
              },
            },
            password: redisConfig!.password,
            database: redisConfig!.db,
          });
        }

        this.redisClient.on('error', err => {
          this.logger.error(`Redis client error: ${err.message}`, err.stack);
        });

        this.redisClient.on('connect', () => {
          this.logger.log('Redis client connected for distributed locking');
          this.connectionAttempts = 0;
        });

        this.redisClient.on('reconnecting', () => {
          this.logger.log('Redis client reconnecting...');
        });
      }

      if (!this.redisClient.isOpen) {
        await this.redisClient.connect();
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis client: ${error.message}`,
        error.stack,
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
    if (!this.useRedis && process.env.NODE_ENV !== 'test') {
      return false;
    }

    if (!this.redisClient) {
      try {
        await this.initRedisClient();
      } catch (error) {
        this.logger.error(
          `Failed to initialize Redis client: ${error.message}`,
        );
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
        const result = await this.redisClient!.set(lockResource, lockToken, {
          NX: true,
          PX: opts.ttl,
        });

        if (result === 'OK') {
          this.logger.debug(
            `Acquired lock for ${lockKey} with token ${lockToken}`,
          );
          return lockToken;
        }

        // Lock acquisition failed, wait and retry
        await new Promise(resolve => setTimeout(resolve, opts.retryDelay));
        retries++;
      } catch (error) {
        this.logger.error(
          `Error acquiring lock for ${lockKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );

        // Try to reconnect if there's a connection issue
        if (
          error instanceof Error &&
          (error.message.includes('connection') ||
            error.message.includes('network'))
        ) {
          try {
            await this.initRedisClient();
          } catch (reconnectError) {
            this.logger.error(
              `Failed to reconnect to Redis: ${reconnectError instanceof Error ? reconnectError.message : 'Unknown error'}`,
            );
            return null;
          }
        } else {
          return null;
        }
      }
    }

    this.logger.warn(
      `Failed to acquire lock for ${lockKey} after ${retries} retries`,
    );
    return null;
  }

  /**
   * Releases a distributed lock
   * @param lockKey The key to unlock
   * @param lockToken The token used to acquire the lock
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
      // Use Lua script to ensure atomic release
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;

      const result = await this.redisClient!.eval(script, {
        keys: [lockResource],
        arguments: [lockToken],
      });

      const released = result === 1;
      if (released) {
        this.logger.debug(
          `Released lock for ${lockKey} with token ${lockToken}`,
        );
      } else {
        this.logger.warn(
          `Failed to release lock for ${lockKey} with token ${lockToken}`,
        );
      }

      return released;
    } catch (error) {
      this.logger.error(
        `Error releasing lock for ${lockKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  /**
   * Executes a function with a distributed lock
   * @param lockKey The key to lock
   * @param fn The function to execute
   * @param options Lock options
   * @returns The result of the function execution
   */
  async withLock<T>(
    lockKey: string,
    fn: () => Promise<T>,
    options?: LockOptions,
  ): Promise<T> {
    const token = await this.acquireLock(lockKey, options);
    if (!token) {
      throw new Error(`Failed to acquire lock for ${lockKey}`);
    }

    try {
      const result = await fn();
      return result;
    } finally {
      try {
        await this.releaseLock(lockKey, token);
      } catch (error) {
        this.logger.error(
          `Error releasing lock for ${lockKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
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

    const lockResource = `lock:${lockKey}`;

    try {
      const value = await this.redisClient!.get(lockResource);
      return value !== null;
    } catch (error) {
      this.logger.error(
        `Error checking lock for ${lockKey}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }
}
