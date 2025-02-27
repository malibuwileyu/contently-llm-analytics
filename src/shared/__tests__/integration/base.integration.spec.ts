// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { BaseService } from '../../classes/base.service';
import { BaseEntity } from '../../entities/base.entity';
import { NotFoundException } from '@nestjs/common';

// Create a test entity class
class TestEntity extends BaseEntity {
  name: string;
  description: string;
}

// Create a test service class
class TestService extends BaseService<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository);
  }
}

// Create test entity factory
const createTestEntity = (
  overrides: Partial<TestEntity> = {},
): Partial<TestEntity> => ({
  id: 'test-id',
  name: 'Test Name',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const createTestEntityList = (
  count: number,
  overrides: Partial<TestEntity> = {},
): Partial<TestEntity>[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...createTestEntity(),
    id: `test-id-${index + 1}`,
    ...overrides,
  }));
};

describe('Base Service Tests', () => {
  let service: TestService;
  let repository: Partial<Record<keyof Repository<TestEntity>, jest.Mock>>;

  beforeEach(() => {
    // Create a mock repository
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };

    // Create service directly with the mock repository
    service = new TestService(repository as unknown as Repository<TestEntity>);
  });

  describe('CRUD operations', () => {
    it('should create and retrieve an entity', async () => {
      // Arrange
      const testData = createTestEntity();
      const createdEntity = { ...testData, id: 'new-id' } as TestEntity;

      repository.create!.mockReturnValue(testData as TestEntity);
      repository.save!.mockResolvedValue(createdEntity);
      repository.findOne!.mockResolvedValue(createdEntity);

      // Act
      const entity = await service.create(testData);

      // Assert
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
      expect(entity.name).toBe(testData.name);
      expect(entity.description).toBe(testData.description);

      const found = await service.findById(entity.id);
      expect(found).toEqual(entity);
    });

    it('should update an entity', async () => {
      // Arrange
      const entity = createTestEntity() as TestEntity;
      const updateData = createTestEntity({
        name: 'Updated Name',
        description: 'Updated Description',
      });
      const updatedEntity = {
        ...entity,
        ...updateData,
        updatedAt: new Date(),
      } as TestEntity;

      repository.update!.mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: [],
      });
      repository.findOne!.mockResolvedValue(updatedEntity);

      // Act
      const updated = await service.update(entity.id, updateData);

      // Assert
      expect(updated.name).toBe(updateData.name);
      expect(updated.description).toBe(updateData.description);
    });

    it('should delete an entity', async () => {
      // Arrange
      const entity = createTestEntity() as TestEntity;

      repository.delete!.mockResolvedValue({ affected: 1, raw: [] });
      repository.findOne!.mockImplementation(() => {
        throw new NotFoundException(`Entity with id ${entity.id} not found`);
      });

      // Act & Assert
      await service.delete(entity.id);
      await expect(service.findById(entity.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should find all entities', async () => {
      // Arrange
      const testEntities = createTestEntityList(3) as TestEntity[];

      repository.find!.mockResolvedValue(testEntities);

      // Act
      const entities = await service.findAll();

      // Assert
      expect(entities).toHaveLength(3);
      expect(entities).toEqual(testEntities);
    });

    it('should find entities by condition', async () => {
      // Arrange
      const targetEntity = createTestEntity({
        name: 'Search Target',
      }) as TestEntity;

      repository.find!.mockResolvedValue([targetEntity]);

      // Act
      const entities = await service.findAll({
        where: { name: 'Search Target' },
      } as FindManyOptions<TestEntity>);

      // Assert
      expect(entities).toHaveLength(1);
      expect(entities[0]?.name).toBe('Search Target');
    });
  });
});
