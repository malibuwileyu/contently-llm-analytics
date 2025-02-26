import { CacheModuleOptions } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import { RedisConfig } from '../config/redis.config';

export const createCacheConfig = (redisConfig: RedisConfig): CacheModuleOptions => {
  // Use in-memory cache for development if REDIS_HOST is not set
  if (!process.env.REDIS_HOST && process.env.NODE_ENV === 'development') {
    return {
      ttl: redisConfig.ttl,
      max: redisConfig.max,
      isGlobal: redisConfig.isGlobal,
    };
  }

  // Use Redis store for production or if REDIS_HOST is set
  return {
    store: redisStore,
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    ttl: redisConfig.ttl,
    max: redisConfig.max,
    isGlobal: redisConfig.isGlobal,
    db: redisConfig.db,
  };
};
