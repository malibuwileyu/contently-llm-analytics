import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';
export const NO_CACHE_METADATA = 'cache:none';

/**
 * Sets the cache key for a method
 */
export const CacheKey = (key: string): MethodDecorator => {
  return SetMetadata(CACHE_KEY_METADATA, key);
};

/**
 * Sets the cache TTL for a method
 */
export const CacheTTL = (ttl: number): MethodDecorator => {
  return SetMetadata(CACHE_TTL_METADATA, ttl);
};

/**
 * Disables caching for a method
 */
export const NoCache = (): MethodDecorator => {
  return SetMetadata(NO_CACHE_METADATA, true);
};
