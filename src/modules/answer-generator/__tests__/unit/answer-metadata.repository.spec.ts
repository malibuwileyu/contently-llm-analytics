import { Test, TestingModule } from '@nestjs/testing';
import { Repository, UpdateResult } from 'typeorm';
import { AnswerMetadataRepository } from '../../repositories/answer-metadata.repository';
import { AnswerMetadata } from '../../entities/answer-metadata.entity';
import { CreateAnswerMetadataDto } from '../../interfaces/answer-metadata.interface';

describe('AnswerMetadataRepository', () => {
  let repository: AnswerMetadataRepository;
  let mockTypeOrmRepository: jest.Mocked<Repository<AnswerMetadata>>;

  beforeEach(async () => {
    mockTypeOrmRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerMetadataRepository,
        {
          provide: 'AnswerMetadataRepository',
          useValue: mockTypeOrmRepository,
        },
      ],
    })
      .overrideProvider('AnswerMetadataRepository')
      .useValue(mockTypeOrmRepository)
      .compile();

    repository = new AnswerMetadataRepository(mockTypeOrmRepository);
  });

  describe('findByAnswerId', () => {
    it('should find metadata by answer id', async () => {
      // Arrange
      const answerId = 'answer-123';
      const expectedMetadata = [
        {
          id: 'meta-1',
          answerId,
          key: 'key1',
          textValue: 'value1',
          valueType: 'text',
        },
        {
          id: 'meta-2',
          answerId,
          key: 'key2',
          textValue: 'value2',
          valueType: 'text',
        },
      ] as AnswerMetadata[];
      mockTypeOrmRepository.find.mockResolvedValue(expectedMetadata);

      // Act
      const result = await repository.findByAnswerId(answerId);

      // Assert
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { answerId },
      });
      expect(result).toEqual(expectedMetadata);
    });

    it('should return empty array when no metadata is found', async () => {
      // Arrange
      const answerId = 'answer-123';
      mockTypeOrmRepository.find.mockResolvedValue([]);

      // Act
      const result = await repository.findByAnswerId(answerId);

      // Assert
      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { answerId },
      });
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('should create metadata', async () => {
      // Arrange
      const metadataDto: CreateAnswerMetadataDto = {
        answerId: 'answer-123',
        key: 'test-key',
        textValue: 'test-value',
        valueType: 'text',
      };
      const createdMetadata = {
        id: 'meta-1',
        ...metadataDto,
      } as AnswerMetadata;
      mockTypeOrmRepository.create.mockReturnValue(createdMetadata);
      mockTypeOrmRepository.save.mockResolvedValue(createdMetadata);

      // Act
      const result = await repository.create(metadataDto);

      // Assert
      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(metadataDto);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(createdMetadata);
      expect(result).toEqual(createdMetadata);
    });

    it('should handle errors during creation', async () => {
      // Arrange
      const metadataDto: CreateAnswerMetadataDto = {
        answerId: 'answer-123',
        key: 'test-key',
        textValue: 'test-value',
        valueType: 'text',
      };
      mockTypeOrmRepository.create.mockReturnValue({} as AnswerMetadata);
      mockTypeOrmRepository.save.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(repository.create(metadataDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('createMany', () => {
    it('should create multiple metadata entries', async () => {
      // Arrange
      const metadataDtos: CreateAnswerMetadataDto[] = [
        {
          answerId: 'answer-123',
          key: 'key1',
          textValue: 'value1',
          valueType: 'text',
        },
        {
          answerId: 'answer-123',
          key: 'key2',
          textValue: 'value2',
          valueType: 'text',
        },
      ];
      const createdMetadata = metadataDtos.map((dto, index) => ({
        id: `meta-${index + 1}`,
        ...dto,
      })) as AnswerMetadata[];

      mockTypeOrmRepository.create.mockImplementation(
        dto =>
          ({
            id: `meta-${Math.random()}`,
            ...dto,
          }) as AnswerMetadata,
      );

      // Use type assertion to make TypeScript happy
      mockTypeOrmRepository.save.mockResolvedValue(createdMetadata as any);

      // Act
      const result = await repository.createMany(metadataDtos);

      // Assert
      expect(mockTypeOrmRepository.create).toHaveBeenCalledTimes(2);
      expect(mockTypeOrmRepository.save).toHaveBeenCalled();
      expect(result).toEqual(createdMetadata);
    });

    it('should handle empty array', async () => {
      // Arrange
      const emptyArray: CreateAnswerMetadataDto[] = [];

      // Use type assertion for empty array
      mockTypeOrmRepository.save.mockResolvedValue([] as any);

      // Act
      const result = await repository.createMany(emptyArray);

      // Assert
      // The implementation calls save with an empty array, so we should expect it to be called
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe('deleteByAnswerId', () => {
    it('should delete metadata by answer id', async () => {
      // Arrange
      const answerId = 'answer-123';
      const updateResult: UpdateResult = {
        affected: 2,
        raw: {},
        generatedMaps: [],
      };
      mockTypeOrmRepository.softDelete.mockResolvedValue(updateResult);

      // Act
      const result = await repository.deleteByAnswerId(answerId);

      // Assert
      expect(mockTypeOrmRepository.softDelete).toHaveBeenCalledWith({
        answerId,
      });
      expect(result).toBe(true);
    });

    it('should return false when no metadata is found', async () => {
      // Arrange
      const answerId = 'answer-123';
      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };
      mockTypeOrmRepository.softDelete.mockResolvedValue(updateResult);

      // Act
      const result = await repository.deleteByAnswerId(answerId);

      // Assert
      expect(mockTypeOrmRepository.softDelete).toHaveBeenCalledWith({
        answerId,
      });
      expect(result).toBe(false);
    });
  });
});
