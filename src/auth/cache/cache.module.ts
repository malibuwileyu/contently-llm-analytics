import { Module, forwardRef } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createCacheConfig } from './cache.config';
import { CacheService } from './cache.service';
import { RedisConfig } from '../config/redis.config';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { CacheController } from './cache.controller';
import { AuthModule } from '../auth/auth.module';
import { DistributedLockService } from './distributed-lock.service';
import { CacheWarmupService } from './cache-warmup.service';

@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<RedisConfig>('redis');
        if (!redisConfig) {
          throw new Error('Redis configuration not found');
        }
        return createCacheConfig(redisConfig);
      },
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [CacheController],
  providers: [
    CacheService,
    CacheInterceptor,
    DistributedLockService,
    CacheWarmupService,
  ],
  exports: [
    CacheService,
    CacheInterceptor,
    DistributedLockService,
    CacheWarmupService,
  ],
})
export class CacheModule {}
