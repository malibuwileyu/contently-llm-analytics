declare module 'cache-manager-redis-store' {
  import { CacheStoreFactory } from '@nestjs/cache-manager';
  import { RedisClientOptions } from 'redis';

  interface RedisStoreOptions extends RedisClientOptions {
    ttl?: number;
    prefix?: string;
  }

  const redisStore: CacheStoreFactory<RedisStoreOptions>;
  export = redisStore;
}
