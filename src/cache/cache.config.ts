import { CacheModuleOptions } from '@nestjs/cache-manager';

export const cacheConfig: CacheModuleOptions = {
  ttl: 300, // 5 minutes default TTL
  max: 100, // maximum number of items in cache
  isGlobal: true,
};
