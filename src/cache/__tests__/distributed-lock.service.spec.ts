import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DistributedLockService } from '../distributed-lock.service';
import redisConfig from '../../config/redis.config';

describe('DistributedLockService', () => {
  let service: DistributedLockService;
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
      ],
      providers: [DistributedLockService],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    configService = module.get<ConfigService>(ConfigService);

    // Skip Redis connection in tests
    jest.spyOn(service as any, 'initRedisClient').mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_TTL;
    delete process.env.REDIS_MAX_ITEMS;
    
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Lock operations', () => {
    it('should acquire a lock successfully', async () => {
      // Mock Redis client
      const mockRedisClient = {
        set: jest.fn().mockResolvedValue('OK'),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const result = await service.acquireLock(lockKey);

      expect(result).not.toBeNull();
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `lock:${lockKey}`,
        expect.any(String),
        expect.objectContaining({
          NX: true,
          PX: expect.any(Number),
        }),
      );
    });

    it('should fail to acquire a lock if Redis returns null', async () => {
      // Mock Redis client
      const mockRedisClient = {
        set: jest.fn().mockResolvedValue(null),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const result = await service.acquireLock(lockKey, { maxRetries: 1 });

      expect(result).toBeNull();
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should release a lock successfully', async () => {
      // Mock Redis client
      const mockRedisClient = {
        eval: jest.fn().mockResolvedValue(1),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const lockToken = 'test-token';
      const result = await service.releaseLock(lockKey, lockToken);

      expect(result).toBe(true);
      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          keys: [`lock:${lockKey}`],
          arguments: [lockToken],
        }),
      );
    });

    it('should fail to release a lock if token does not match', async () => {
      // Mock Redis client
      const mockRedisClient = {
        eval: jest.fn().mockResolvedValue(0),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const lockToken = 'test-token';
      const result = await service.releaseLock(lockKey, lockToken);

      expect(result).toBe(false);
      expect(mockRedisClient.eval).toHaveBeenCalled();
    });
  });

  describe('withLock', () => {
    it('should execute function with lock and return result', async () => {
      // Mock acquireLock and releaseLock
      jest.spyOn(service, 'acquireLock').mockResolvedValue('test-token');
      jest.spyOn(service, 'releaseLock').mockResolvedValue(true);

      const lockKey = 'test-lock';
      const mockFn = jest.fn().mockResolvedValue('function-result');
      
      const result = await service.withLock(lockKey, mockFn);

      expect(result).toBe('function-result');
      expect(service.acquireLock).toHaveBeenCalledWith(lockKey, undefined);
      expect(mockFn).toHaveBeenCalled();
      expect(service.releaseLock).toHaveBeenCalledWith(lockKey, 'test-token');
    });

    it('should return null if lock acquisition fails', async () => {
      // Mock acquireLock to fail
      jest.spyOn(service, 'acquireLock').mockResolvedValue(null);
      
      const lockKey = 'test-lock';
      const mockFn = jest.fn().mockResolvedValue('function-result');
      
      const result = await service.withLock(lockKey, mockFn);

      expect(result).toBeNull();
      expect(service.acquireLock).toHaveBeenCalledWith(lockKey, undefined);
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should release lock even if function throws', async () => {
      // Mock acquireLock and releaseLock
      jest.spyOn(service, 'acquireLock').mockResolvedValue('test-token');
      jest.spyOn(service, 'releaseLock').mockResolvedValue(true);

      const lockKey = 'test-lock';
      const mockFn = jest.fn().mockRejectedValue(new Error('Function error'));
      
      await expect(service.withLock(lockKey, mockFn)).rejects.toThrow('Function error');
      
      expect(service.acquireLock).toHaveBeenCalledWith(lockKey, undefined);
      expect(mockFn).toHaveBeenCalled();
      expect(service.releaseLock).toHaveBeenCalledWith(lockKey, 'test-token');
    });
  });

  describe('isLocked', () => {
    it('should return true if lock exists', async () => {
      // Mock Redis client
      const mockRedisClient = {
        exists: jest.fn().mockResolvedValue(1),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const result = await service.isLocked(lockKey);

      expect(result).toBe(true);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`lock:${lockKey}`);
    });

    it('should return false if lock does not exist', async () => {
      // Mock Redis client
      const mockRedisClient = {
        exists: jest.fn().mockResolvedValue(0),
      };
      (service as any).redisClient = mockRedisClient;
      (service as any).useRedis = true;

      const lockKey = 'test-lock';
      const result = await service.isLocked(lockKey);

      expect(result).toBe(false);
      expect(mockRedisClient.exists).toHaveBeenCalledWith(`lock:${lockKey}`);
    });
  });
}); 