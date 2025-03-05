import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheController } from './cache.controller';

@Module({
  imports: [
    NestCacheModule.register({
      ttl: 60 * 60, // 1 hour
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [CacheController],
  exports: [NestCacheModule],
})
export class CacheModule {}
