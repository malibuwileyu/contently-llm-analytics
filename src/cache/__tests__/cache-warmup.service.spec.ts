import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheWarmupService } from '../cache-warmup.service';
import { CacheService } from '../cache.service';
import { DistributedLockService } from '../distributed-lock.service';

describe('CacheWarmupService', () => {
  let service: CacheWarmupService;
  let cacheService: CacheService;
  let lockService: DistributedLockService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmupService,
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: DistributedLockService,
          useValue: {
            acquireLock: jest.fn(),
            releaseLock: jest.fn(),
            isLocked: jest.fn(),
            withLock: jest.fn(async (key: string, fn: () => Promise<void>) => {
              await fn();
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              switch (key) {
                case 'cache.warmup.enabled':
                  return true;
                case 'cache.warmup.interval':
                  return 60000;
                case 'cache.warmup.timeout':
                  return 30000;
                default:
                  return undefined;
              }
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheWarmupService>(CacheWarmupService);
    cacheService = module.get<CacheService>(CacheService);
    lockService = module.get<DistributedLockService>(DistributedLockService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Cache warmup', () => {
    it('should register warmup provider', () => {
      const provider = {
        key: 'test-provider',
        warmup: jest.fn(),
        priority: 1,
      };

      service.registerProvider(provider);
      expect(service.getProviders()).toContainEqual(provider);
    });

    it('should execute warmup in priority order', async () => {
      const provider1 = {
        key: 'provider1',
        warmup: jest.fn().mockResolvedValue(undefined),
        priority: 1,
      };

      const provider2 = {
        key: 'provider2',
        warmup: jest.fn().mockResolvedValue(undefined),
        priority: 2,
      };

      service.registerProvider(provider1);
      service.registerProvider(provider2);

      await service.warmupCache();

      // Verify execution order
      expect(provider2.warmup).toHaveBeenCalled();
      expect(provider1.warmup).toHaveBeenCalled();
      expect(provider2.warmup.mock.invocationCallOrder[0])
        .toBeLessThan(provider1.warmup.mock.invocationCallOrder[0]);
    });

    it('should handle warmup errors', async () => {
      const provider = {
        key: 'error-provider',
        warmup: jest.fn().mockRejectedValue(new Error('Warmup failed')),
        priority: 1,
      };

      service.registerProvider(provider);
      await expect(service.warmupCache()).resolves.not.toThrow();
    });

    it('should use distributed lock during warmup', async () => {
      const provider = {
        key: 'test-provider',
        warmup: jest.fn(),
        priority: 1,
      };

      service.registerProvider(provider);
      await service.warmupCache();

      expect(lockService.withLock).toHaveBeenCalledWith(
        'cache:warmup:test-provider',
        expect.any(Function),
        expect.any(Object),
      );
    });
  });
});
