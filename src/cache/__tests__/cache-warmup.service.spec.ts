import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheWarmupService, CacheWarmupProvider } from '../cache-warmup.service';
import { CacheService } from '../cache.service';
import { DistributedLockService } from '../distributed-lock.service';

describe('CacheWarmupService', () => {
  let service: CacheWarmupService;
  let lockService: DistributedLockService;
  let configService: ConfigService;

  // Mock providers
  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockLockService = {
    withLock: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmupService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: DistributedLockService,
          useValue: mockLockService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheWarmupService>(CacheWarmupService);
    lockService = module.get<DistributedLockService>(DistributedLockService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerProvider', () => {
    it('should register a provider', () => {
      const provider: CacheWarmupProvider = {
        key: 'test-provider',
        warmup: jest.fn().mockResolvedValue(undefined),
      };

      service.registerProvider(provider);
      expect(service.getProviders()).toContainEqual(provider);
    });
  });

  describe('onModuleInit', () => {
    it('should not run warmup if disabled', async () => {
      mockConfigService.get.mockReturnValue(false);

      await service.onModuleInit();
      expect(mockLockService.withLock).not.toHaveBeenCalled();
    });

    it('should not run warmup if no providers are registered', async () => {
      mockConfigService.get.mockReturnValue(true);

      await service.onModuleInit();
      expect(mockLockService.withLock).not.toHaveBeenCalled();
    });

    it('should execute providers in priority order', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockLockService.withLock.mockImplementation(async (key, fn) => fn());

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

      const provider3 = {
        key: 'provider3',
        warmup: jest.fn().mockResolvedValue(undefined),
        priority: 0,
      };

      service.registerProvider(provider1);
      service.registerProvider(provider2);
      service.registerProvider(provider3);

      await service.onModuleInit();

      // Verify all providers were called
      expect(provider1.warmup).toHaveBeenCalled();
      expect(provider2.warmup).toHaveBeenCalled();
      expect(provider3.warmup).toHaveBeenCalled();
      
      // Verify the order of calls based on the number of calls to withLock
      expect(mockLockService.withLock).toHaveBeenCalledTimes(3);
      
      // Check that the first call was for provider2 (highest priority)
      expect(mockLockService.withLock.mock.calls[0][0]).toBe('warmup:provider2');
      
      // Check that the second call was for provider1 (medium priority)
      expect(mockLockService.withLock.mock.calls[1][0]).toBe('warmup:provider1');
      
      // Check that the third call was for provider3 (lowest priority)
      expect(mockLockService.withLock.mock.calls[2][0]).toBe('warmup:provider3');
    });

    it('should handle provider errors gracefully', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockLockService.withLock.mockImplementation(async (key, fn) => fn());

      const successProvider: CacheWarmupProvider = {
        key: 'success-provider',
        warmup: jest.fn().mockResolvedValue(undefined),
      };

      const errorProvider: CacheWarmupProvider = {
        key: 'error-provider',
        warmup: jest.fn().mockRejectedValue(new Error('Warmup error')),
      };

      service.registerProvider(successProvider);
      service.registerProvider(errorProvider);

      await service.onModuleInit();

      expect(successProvider.warmup).toHaveBeenCalled();
      expect(errorProvider.warmup).toHaveBeenCalled();
      // Service should continue despite errors
    });

    it('should handle lock acquisition failures', async () => {
      mockConfigService.get.mockReturnValue(true);
      mockLockService.withLock.mockResolvedValue(null); // Lock acquisition failed

      const provider: CacheWarmupProvider = {
        key: 'test-provider',
        warmup: jest.fn().mockResolvedValue(undefined),
      };

      service.registerProvider(provider);

      await service.onModuleInit();

      expect(mockLockService.withLock).toHaveBeenCalled();
      expect(provider.warmup).not.toHaveBeenCalled();
    });
  });
}); 