import { Module } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { cacheConfig } from './cache.config';
import { CacheService } from './cache.service';

@Module({
  imports: [NestCacheModule.register(cacheConfig)],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
