import { SetMetadata } from '@nestjs/common';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../interceptors/cache.interceptor';

/**
 * Sets a custom cache key for a controller method
 * @param key The cache key to use
 */
export const CacheKey = (key: string) => SetMetadata(CACHE_KEY_METADATA, key);

/**
 * Sets a custom TTL (time to live) for a cached controller method
 * @param ttl Time to live in seconds
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_METADATA, ttl);

/**
 * Disables caching for a controller method
 */
export const NoCache = () => SetMetadata(CACHE_KEY_METADATA, null); 