import { Injectable } from '@nestjs/common';

/**
 * Service for caching operations
 */
@Injectable()
export class CacheService {
  private cache: Map<string, unknown> = new Map();

  /**
   * Get a value from the cache
   * @param key The cache key
   */
  async get<T>(key: string): Promise<T | null> {
    return (this.cache.get(key) as T) || null;
  }

  /**
   * Set a value in the cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttl Time to live in seconds
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cache.set(key, value);

    if (ttl) {
      setTimeout(() => {
        this.cache.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * Delete a value from the cache
   * @param key The cache key
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }
}
