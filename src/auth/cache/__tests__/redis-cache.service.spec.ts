import { Test, TestingModule } from '@nestjs/testing';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from '../cache.service';
import { createCacheConfig } from '../cache.config';
import redisConfig from '../../../config/redis.config';

describe('CacheService with Redis', () => {
  let service: CacheService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Mock environment variables for Redis
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = '6379';
    process.env.REDIS_TTL = '60';
    process.env.REDIS_MAX_ITEMS = '100';

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
    configService = module.get<ConfigService>(ConfigService);

    // Skip Redis connection in tests
    jest
      .spyOn(service as any, 'initRedisClient')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_TTL;
    delete process.env.REDIS_MAX_ITEMS;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Redis configuration', () => {
    it('should load Redis configuration from environment variables', () => {
      const redisConf = configService.get('redis');
      expect(redisConf).toBeDefined();
      expect(redisConf.host).toBe('localhost');
      expect(redisConf.port).toBe(6379);
      expect(redisConf.ttl).toBe(60);
      expect(redisConf.max).toBe(100);
    });
  });

  describe('Cache operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { test: 'data' };

      // Mock the cache manager methods
      jest.spyOn(service['cacheManager'], 'set').mockResolvedValue(undefined);
      jest.spyOn(service['cacheManager'], 'get').mockResolvedValue(value);

      await service.set(key, value);
      const result = await service.get(key);

      expect(result).toEqual(value);
      expect(service['cacheManager'].set).toHaveBeenCalledWith(
        key,
        value,
        undefined,
      );
      expect(service['cacheManager'].get).toHaveBeenCalledWith(key);
    });

    it('should delete a value', async () => {
      const key = 'test-key';

      // Mock the cache manager methods
      jest
        .spyOn(service['cacheManager'], 'del')
        .mockImplementation(() => Promise.resolve(true));

      await service.del(key);

      expect(service['cacheManager'].del).toHaveBeenCalledWith(key);
    });

    it('should handle getOrSet correctly', async () => {
      const key = 'test-key';
      const value = { test: 'data' };
      const factory = jest.fn().mockResolvedValue(value);

      // First call - cache miss
      jest.spyOn(service['cacheManager'], 'get').mockResolvedValueOnce(null);
      jest
        .spyOn(service['cacheManager'], 'set')
        .mockResolvedValueOnce(undefined);

      let result = await service.getOrSet(key, factory);
      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalled();
      expect(service['cacheManager'].set).toHaveBeenCalledWith(
        key,
        value,
        undefined,
      );

      // Second call - cache hit
      jest.spyOn(service['cacheManager'], 'get').mockResolvedValueOnce(value);
      factory.mockClear();

      result = await service.getOrSet(key, factory);
      expect(result).toEqual(value);
      expect(factory).not.toHaveBeenCalled();
    });
  });

  describe('Health check', () => {
    it('should return true when cache is healthy', async () => {
      // Mock the cache operations for health check
      jest.spyOn(service, 'set').mockImplementation(async (key, value) => {
        // Store the value to return it in get
        (service as any).testValue = value;
      });
      jest.spyOn(service, 'get').mockImplementation(async () => {
        // Return the stored value
        return (service as any).testValue;
      });
      jest.spyOn(service, 'del').mockResolvedValue(undefined);

      const result = await service.isHealthy();

      expect(result).toBe(true);
    });

    it('should return false when cache is unhealthy', async () => {
      // Mock a failed health check
      jest
        .spyOn(service, 'set')
        .mockRejectedValue(new Error('Connection error'));

      const result = await service.isHealthy();

      expect(result).toBe(false);
    });
  });

  describe('Redis-specific operations', () => {
    it('should handle pattern deletion gracefully when Redis is not available', async () => {
      // Ensure redisClient is null
      (service as any).redisClient = null;

      const result = await service.delByPattern('test:*');

      expect(result).toBe(0);
    });

    it('should handle stats retrieval gracefully when Redis is not available', async () => {
      // Ensure redisClient is null
      (service as any).redisClient = null;

      const result = await service.getStats();

      expect(result).toBeNull();
    });
  });
});
