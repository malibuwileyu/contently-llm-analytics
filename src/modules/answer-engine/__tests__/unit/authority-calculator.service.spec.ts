import { Test, TestingModule } from '@nestjs/testing';
import { AuthorityCalculatorService } from '../../services/authority-calculator.service';
import { CacheService } from '../../../../auth/cache/cache.service';

describe('AuthorityCalculatorService', () => {
  let service: AuthorityCalculatorService;
  let cacheService: Partial<CacheService>;

  beforeEach(async () => {
    // Create a mock cache service
    cacheService = {
      getOrSet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorityCalculatorService,
        {
          provide: CacheService,
          useValue: cacheService,
        },
      ],
    }).compile();

    service = module.get<AuthorityCalculatorService>(
      AuthorityCalculatorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAuthority', () => {
    it('should return cached authority score if available', async () => {
      // Arrange
      const source = 'https://example.com';
      const expectedScore = 0.75;
      (cacheService.getOrSet as jest.Mock).mockResolvedValue(expectedScore);

      // Act
      const result = await service.calculateAuthority(source);

      // Assert
      expect(result).toBe(expectedScore);
      expect(cacheService.getOrSet).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Function),
        86400,
      );
    });

    it('should calculate authority score for educational domains', async () => {
      // Arrange
      const source = 'https://stanford.edu/research/paper';

      // Mock cache miss and calculate score
      (cacheService.getOrSet as jest.Mock).mockImplementation(
        async (key, factory) => {
          return factory();
        },
      );

      // Act
      const result = await service.calculateAuthority(source);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0.85); // Base edu score
      expect(result).toBeLessThanOrEqual(1); // Max score
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should calculate authority score for government domains', async () => {
      // Arrange
      const source = 'https://nih.gov/research';

      // Mock cache miss and calculate score
      (cacheService.getOrSet as jest.Mock).mockImplementation(
        async (key, factory) => {
          return factory();
        },
      );

      // Act
      const result = await service.calculateAuthority(source);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0.9); // Base gov score
      expect(result).toBeLessThanOrEqual(1); // Max score
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should calculate authority score for commercial domains', async () => {
      // Arrange
      const source = 'https://example.com/blog';

      // Mock cache miss and calculate score
      (cacheService.getOrSet as jest.Mock).mockImplementation(
        async (key, factory) => {
          return factory();
        },
      );

      // Act
      const result = await service.calculateAuthority(source);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0); // Min score
      expect(result).toBeLessThanOrEqual(1); // Max score
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });

    it('should handle invalid URLs', async () => {
      // Arrange
      const source = 'not-a-valid-url';

      // Mock cache miss and calculate score
      (cacheService.getOrSet as jest.Mock).mockImplementation(
        async (key, factory) => {
          return factory();
        },
      );

      // Act
      const result = await service.calculateAuthority(source);

      // Assert
      expect(result).toBeGreaterThanOrEqual(0); // Min score
      expect(result).toBeLessThanOrEqual(1); // Max score
      expect(cacheService.getOrSet).toHaveBeenCalled();
    });
  });
});
