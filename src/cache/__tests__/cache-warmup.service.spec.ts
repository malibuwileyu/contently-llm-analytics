import { Test, TestingModule } from '@nestjs/testing';
import { CacheWarmupService } from '../cache-warmup.service';
import { CacheService } from '../cache.service';

describe('CacheWarmupService', () => {
  let service: CacheWarmupService;

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
      ],
    }).compile();

    service = module.get<CacheWarmupService>(CacheWarmupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more test cases here
});
