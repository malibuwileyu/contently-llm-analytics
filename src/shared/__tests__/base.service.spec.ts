import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { BaseService } from '../classes/base.service';
import { BaseEntity } from '../entities/base.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

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

// Create test data factory
const testEntityFactory = {
  build: (overrides: Partial<TestEntity> = {}): Partial<TestEntity> => ({
    id: 'test-id',
    name: 'Test Name',
    description: 'Test Description',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }),
  buildList: (count: number, overrides: Partial<TestEntity> = {}): Partial<TestEntity>[] => {
    return Array.from({ length: count }, () => testEntityFactory.build(overrides));
  },
};

describe('BaseService', () => {
  let service: TestService;
  let repository: Repository<TestEntity>;

  beforeEach(async () => {
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
    } as unknown as Repository<TestEntity>;

    // Create the service with the mock repository
    service = new TestService(repository);
  });

  describe('findById', () => {
    it('should find an entity by id', async () => {
      const entity = testEntityFactory.build() as TestEntity;
      jest.spyOn(repository, 'findOne').mockResolvedValue(entity);

      const result = await service.findById('1');
      expect(result).toBe(entity);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('should throw NotFoundException when entity not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow('Entity with id 1 not found');
    });
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const entity = testEntityFactory.build() as TestEntity;
      jest.spyOn(repository, 'create').mockReturnValue(entity);
      jest.spyOn(repository, 'save').mockResolvedValue(entity);

      const result = await service.create({ name: 'Test' });
      expect(result).toBe(entity);
      expect(repository.create).toHaveBeenCalledWith({ name: 'Test' });
      expect(repository.save).toHaveBeenCalledWith(entity);
    });
  });

  describe('update', () => {
    it('should update an existing entity', async () => {
      const entity = testEntityFactory.build() as TestEntity;
      jest.spyOn(repository, 'update').mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: []
      });
      jest.spyOn(repository, 'findOne').mockResolvedValue(entity);

      const result = await service.update('1', { name: 'Updated' });
      expect(result).toBe(entity);
      expect(repository.update).toHaveBeenCalledWith('1', { name: 'Updated' } as any);
    });
  });

  describe('delete', () => {
    it('should delete an entity', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 1, raw: [] });

      await service.delete('1');
      expect(repository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when entity not found', async () => {
      jest.spyOn(repository, 'delete').mockResolvedValue({ affected: 0, raw: [] });

      await expect(service.delete('1')).rejects.toThrow('Entity with id 1 not found');
    });
  });

  describe('findAll', () => {
    it('should find all entities with options', async () => {
      const entities = testEntityFactory.buildList(2) as TestEntity[];
      const options = {
        where: { name: 'Test' },
        order: { createdAt: 'DESC' } as any,
      };

      jest.spyOn(repository, 'find').mockResolvedValue(entities);

      const result = await service.findAll(options);
      expect(result).toBe(entities);
      expect(repository.find).toHaveBeenCalledWith(options);
    });
  });

  describe('softDelete', () => {
    it('should soft delete an entity', async () => {
      jest.spyOn(repository, 'softDelete').mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: []
      });

      await service.softDelete('1');
      expect(repository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when entity not found', async () => {
      jest.spyOn(repository, 'softDelete').mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: []
      });

      await expect(service.softDelete('1')).rejects.toThrow('Entity with id 1 not found');
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted entity', async () => {
      jest.spyOn(repository, 'restore').mockResolvedValue({
        affected: 1,
        raw: [],
        generatedMaps: []
      });

      await service.restore('1');
      expect(repository.restore).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when entity not found', async () => {
      jest.spyOn(repository, 'restore').mockResolvedValue({
        affected: 0,
        raw: [],
        generatedMaps: []
      });

      await expect(service.restore('1')).rejects.toThrow('Entity with id 1 not found');
    });
  });
}); 