import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from '../cache.service';
import { createCacheConfig } from '../cache.config';
import redisConfig from '../../config/redis.config';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(async () => {
    // Mock environment variables for Redis
    process.env.REDIS_HOST = '';
    process.env.NODE_ENV = 'development';

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [redisConfig],
        }),
        NestCacheModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const redisConfig = configService.get('redis');
            return createCacheConfig(redisConfig);
          },
        }),
      ],
      providers: [CacheService],
    }).compile();

    service = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.REDIS_HOST;
    delete process.env.NODE_ENV;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      
      await service.set(key, value);
      const result = await service.get(key);
      
      expect(result).toEqual(value);
    });

    it('should set value if not exists', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      
      const result = await service.getOrSet(key, async () => value);
      
      expect(result).toEqual(value);
    });

    it('should respect TTL and expire cached values', async () => {
      const key = 'ttl-test';
      const value = { test: 'data' };
      const ttl = 1; // 1 second TTL
      
      await service.set(key, value, ttl);
      
      // Value should exist initially
      let result = await service.get(key);
      expect(result).toEqual(value);
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Value should be null after TTL
      result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should handle factory function errors', async () => {
      const key = 'error-test';
      const error = new Error('Factory error');
      
      await expect(
        service.getOrSet(key, async () => {
          throw error;
        })
      ).rejects.toThrow(error);
    });
  });

  describe('delete', () => {
    it('should successfully delete cached value', async () => {
      const key = 'delete-test';
      const value = { test: 'data' };
      
      await service.set(key, value);
      let result = await service.get(key);
      expect(result).toEqual(value);
      
      await service.del(key);
      result = await service.get(key);
      expect(result).toBeNull();
    });

    it('should not error when deleting non-existent key', async () => {
      const key = 'non-existent';
      await expect(service.del(key)).resolves.not.toThrow();
    });
  });
}); 