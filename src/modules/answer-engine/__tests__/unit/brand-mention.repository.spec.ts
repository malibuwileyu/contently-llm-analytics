import { Test } from '@nestjs/testing';
import { BrandMentionRepository } from '../../repositories/brand-mention.repository';
import { BrandMention } from '../../entities/brand-mention.entity';
import { EntityNotFoundError, FindManyOptions } from 'typeorm';

describe('BrandMentionRepository', () => {
  let repository: BrandMentionRepository;
  let queryBuilder: any;
  let dataSource: any;

  beforeEach(async () => {
    // Create mock query builder
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    // Create mock data source
    dataSource = {
      createEntityManager: jest.fn().mockReturnValue({}),
    };

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: BrandMentionRepository,
          useFactory: () => {
            const repo = new BrandMentionRepository(dataSource);
            jest.spyOn(repo, 'createQueryBuilder').mockReturnValue(queryBuilder);
            jest.spyOn(repo, 'find').mockImplementation(() => Promise.resolve([]));
            return repo;
          },
        },
      ],
    }).compile();

    repository = module.get<BrandMentionRepository>(BrandMentionRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findByBrandId', () => {
    it('should find brand mentions by brand ID with options', async () => {
      // Arrange
      const brandId = 'brand-123';
      const options: FindManyOptions<BrandMention> = {
        order: { mentionedAt: 'DESC' as const },
        take: 10,
      };
      const expectedMentions = [
        { id: 'mention-1', brandId },
        { id: 'mention-2', brandId },
      ] as BrandMention[];

      (repository.find as jest.Mock).mockResolvedValue(expectedMentions);

      // Act
      const result = await repository.findByBrandId(brandId, options);

      // Assert
      expect(result).toEqual(expectedMentions);
      expect(repository.find).toHaveBeenCalledWith({
        where: { brandId },
        ...options,
      });
    });

    it('should return empty array when no mentions found', async () => {
      // Arrange
      const brandId = 'brand-123';
      (repository.find as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await repository.findByBrandId(brandId, {});

      // Assert
      expect(result).toEqual([]);
      expect(repository.find).toHaveBeenCalledWith({
        where: { brandId },
      });
    });

    it('should handle errors when finding mentions', async () => {
      // Arrange
      const brandId = 'brand-123';
      const error = new Error('Database error');
      (repository.find as jest.Mock).mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findByBrandId(brandId, {})).rejects.toThrow(error);
    });
  });

  describe('findWithCitations', () => {
    it('should find a brand mention with its citations', async () => {
      // Arrange
      const mentionId = 'mention-123';
      const expectedMention = {
        id: mentionId,
        brandId: 'brand-123',
        citations: [
          { id: 'citation-1', source: 'source-1' },
        ],
      } as BrandMention;

      queryBuilder.getOne.mockResolvedValue(expectedMention);

      // Act
      const result = await repository.findWithCitations(mentionId);

      // Assert
      expect(result).toEqual(expectedMention);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('mention');
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('mention.citations', 'citations');
      expect(queryBuilder.where).toHaveBeenCalledWith('mention.id = :id', { id: mentionId });
      expect(queryBuilder.getOne).toHaveBeenCalled();
    });

    it('should throw EntityNotFoundError when mention not found', async () => {
      // Arrange
      const mentionId = 'non-existent-id';
      queryBuilder.getOne.mockResolvedValue(null);

      // Act & Assert
      await expect(repository.findWithCitations(mentionId))
        .rejects
        .toThrow(EntityNotFoundError);
    });

    it('should handle errors when finding mention with citations', async () => {
      // Arrange
      const mentionId = 'mention-123';
      const error = new Error('Database error');
      queryBuilder.getOne.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.findWithCitations(mentionId)).rejects.toThrow(error);
    });
  });

  describe('getSentimentTrend', () => {
    it('should get sentiment trend for a brand over time', async () => {
      // Arrange
      const brandId = 'brand-123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const expectedTrend = [
        { date: '2023-01-01', averageSentiment: 0.7 },
        { date: '2023-01-02', averageSentiment: 0.8 },
      ];

      queryBuilder.getRawMany.mockResolvedValue(expectedTrend);

      // Act
      const result = await repository.getSentimentTrend(brandId, startDate, endDate);

      // Assert
      expect(result).toEqual(expectedTrend);
      expect(repository.createQueryBuilder).toHaveBeenCalledWith('mention');
      expect(queryBuilder.select).toHaveBeenCalledWith('DATE(mention.mentionedAt)', 'date');
      expect(queryBuilder.addSelect).toHaveBeenCalledWith('AVG(mention.sentiment)', 'averageSentiment');
      expect(queryBuilder.where).toHaveBeenCalledWith('mention.brandId = :brandId', { brandId });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('mention.mentionedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
      expect(queryBuilder.groupBy).toHaveBeenCalledWith('DATE(mention.mentionedAt)');
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('DATE(mention.mentionedAt)', 'ASC');
      expect(queryBuilder.getRawMany).toHaveBeenCalled();
    });

    it('should return empty array when no trend data found', async () => {
      // Arrange
      const brandId = 'brand-123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      queryBuilder.getRawMany.mockResolvedValue([]);

      // Act
      const result = await repository.getSentimentTrend(brandId, startDate, endDate);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle errors when getting sentiment trend', async () => {
      // Arrange
      const brandId = 'brand-123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      const error = new Error('Database error');
      
      queryBuilder.getRawMany.mockRejectedValue(error);

      // Act & Assert
      await expect(repository.getSentimentTrend(brandId, startDate, endDate)).rejects.toThrow(error);
    });
  });
}); 