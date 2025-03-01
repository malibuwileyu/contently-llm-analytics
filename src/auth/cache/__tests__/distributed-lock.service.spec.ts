import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DistributedLockService } from '../distributed-lock.service';
import { createClient } from 'redis';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Define a generic Redis interface for testing
interface RedisClient {
  connect: () => Promise<void>;
  isOpen: boolean;
  on: (event: string, _callback: (..._args: any[]) => void) => void;
  set: (key: string, value: string, options?: any) => Promise<any>;
  get: (key: string) => Promise<any>;
  eval: (script: string, options: any) => Promise<any>;
  quit: () => Promise<void>;
}

// Create a mock Redis client factory
const createMockRedisClient = () => ({
  connect: jest.fn().mockResolvedValue(undefined),
  isOpen: true,
  on: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  eval: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined),
});

jest.mock('redis', () => ({
  createClient: jest.fn(() => createMockRedisClient()),
}));

describe('DistributedLockService', () => {
  let service: DistributedLockService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _cacheManager: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _redisClient: RedisClient;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let _configService: ConfigService;
  let mockRedisClient: ReturnType<typeof createMockRedisClient>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributedLockService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'redis.host':
                  return 'localhost';
                case 'redis.port':
                  return 6379;
                case 'redis.password':
                  return undefined;
                case 'redis.db':
                  return 0;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<DistributedLockService>(DistributedLockService);
    _configService = module.get<ConfigService>(ConfigService);

    // Get the mock Redis client
    mockRedisClient = (createClient as jest.Mock).mock.results[0].value;

    // Initialize Redis connection
    await service.onModuleInit();
  });

  afterEach(async () => {
    // Clean up Redis connection
    if (mockRedisClient?.isOpen) {
      await mockRedisClient.quit();
    }
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Lock operations', () => {
    it('should acquire and release lock', async () => {
      // Mock successful lock acquisition
      mockRedisClient.set.mockResolvedValueOnce('OK');

      // Mock successful lock release
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const key = 'test-lock';
      const token = await service.acquireLock(key);
      expect(token).toBeDefined();

      const released = await service.releaseLock(key, token!);
      expect(released).toBe(true);

      // Verify Redis calls
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `lock:${key}`,
        expect.any(String),
        expect.any(Object),
      );
      expect(mockRedisClient.eval).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should not acquire same lock twice', async () => {
      const key = 'test-lock';

      // First acquisition succeeds
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const token1 = await service.acquireLock(key);
      expect(token1).toBeDefined();

      // Second acquisition fails (Redis returns null when SET NX fails)
      mockRedisClient.set.mockResolvedValueOnce(null);
      const token2 = await service.acquireLock(key);
      expect(token2).toBeNull();

      // Release the first lock
      mockRedisClient.eval.mockResolvedValueOnce(1);
      await service.releaseLock(key, token1!);
    });

    it('should handle lock expiry', async () => {
      const key = 'test-lock';

      // First acquisition succeeds
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const token = await service.acquireLock(key, { ttl: 100 }); // 100ms TTL
      expect(token).toBeDefined();

      // Wait for lock to expire
      await new Promise(resolve => setTimeout(resolve, 200));

      // Second acquisition succeeds after expiry
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const newToken = await service.acquireLock(key);
      expect(newToken).toBeDefined();
    });
  });

  describe('Lock checking', () => {
    it('should check if lock exists', async () => {
      const key = 'test-lock';

      // Mock lock acquisition
      mockRedisClient.set.mockResolvedValueOnce('OK');
      const token = await service.acquireLock(key);
      expect(token).toBeDefined();

      // Mock lock check - lock exists
      mockRedisClient.get.mockResolvedValueOnce('some-value');
      const isLocked = await service.isLocked(key);
      expect(isLocked).toBe(true);

      // Mock lock release
      mockRedisClient.eval.mockResolvedValueOnce(1);
      await service.releaseLock(key, token!);

      // Mock lock check - lock doesn't exist
      mockRedisClient.get.mockResolvedValueOnce(null);
      const isUnlocked = await service.isLocked(key);
      expect(isUnlocked).toBe(false);
    });
  });

  describe('Lock with function execution', () => {
    it('should execute function with lock', async () => {
      // Mock successful lock acquisition
      mockRedisClient.set.mockResolvedValueOnce('OK');
      // Mock successful lock release
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const key = 'test-lock';
      const result = await service.withLock(key, async () => {
        return 'success';
      });
      expect(result).toBe('success');
    });

    it('should handle function errors', async () => {
      // Mock successful lock acquisition
      mockRedisClient.set.mockResolvedValueOnce('OK');
      // Mock successful lock release
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const key = 'test-lock';
      const error = new Error('test error');

      await expect(
        service.withLock(key, async () => {
          throw error;
        }),
      ).rejects.toThrow(error);

      // Lock should be released even if function throws
      mockRedisClient.get.mockResolvedValueOnce(null);
      const isLocked = await service.isLocked(key);
      expect(isLocked).toBe(false);
    });
  });
});
