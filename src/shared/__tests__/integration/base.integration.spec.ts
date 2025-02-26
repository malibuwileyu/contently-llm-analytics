import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { BaseService } from '../../classes/base.service';
import { TestEntity } from '../test.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { createTestDatabaseModule, withTestTransaction } from '../../test-utils';

// Create test entity factory inline since we're having import issues
const testEntityFactory = {
  build: (overrides: Partial<TestEntity> = {}): Partial<TestEntity> => ({
    name: overrides.name ?? 'Test Entity',
    description: overrides.description ?? 'Test Description',
  }),
  buildList: (count: number, overrides: Partial<TestEntity> = {}): Partial<TestEntity>[] => 
    Array.from({ length: count }, () => testEntityFactory.build(overrides))
};

class TestEntityService extends BaseService<TestEntity> {
  constructor(repository: Repository<TestEntity>) {
    super(repository);
  }
}

describe('Base Integration Tests', () => {
  let module: TestingModule;
  let service: TestEntityService;
  let repository: Repository<TestEntity>;

  beforeAll(async () => {
    const testDb = await createTestDatabaseModule([TestEntity]);
    module = await Test.createTestingModule({
      imports: [testDb],
      providers: [
        {
          provide: TestEntityService,
          useFactory: (repo: Repository<TestEntity>) => new TestEntityService(repo),
          inject: [getRepositoryToken(TestEntity)]
        }
      ]
    }).compile();

    service = module.get<TestEntityService>(TestEntityService);
    repository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  beforeEach(async () => {
    await repository.clear();
  });

  describe('CRUD operations', () => {
    it('should create and retrieve an entity', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const testData = testEntityFactory.build();

        // Act
        const entity = await service.create(testData);

        // Assert
        expect(entity).toBeDefined();
        expect(entity.id).toBeDefined();
        expect(entity.name).toBe(testData.name);
        expect(entity.description).toBe(testData.description);
        expect(entity.createdAt).toBeDefined();
        expect(entity.updatedAt).toBeDefined();
        expect(entity.deletedAt).toBeNull();

        const found = await service.findById(entity.id);
        expect(found).toEqual(entity);
      });
    });

    it('should update an entity', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const entity = await service.create(testEntityFactory.build());
        const updateData = testEntityFactory.build();

        // Act
        const updated = await service.update(entity.id, updateData);

        // Assert
        expect(updated.name).toBe(updateData.name);
        expect(updated.description).toBe(updateData.description);
        expect(updated.updatedAt).not.toEqual(entity.updatedAt);
      });
    });

    it('should delete an entity', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const entity = await service.create(testEntityFactory.build());

        // Act
        await service.delete(entity.id);

        // Assert
        await expect(service.findById(entity.id)).rejects.toThrow(NotFoundException);
      });
    });

    it('should find all entities', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const testEntities = testEntityFactory.buildList(3);
        const createdEntities = await Promise.all(
          testEntities.map((entity) => service.create(entity))
        );

        // Act
        const entities = await service.findAll();

        // Assert
        expect(entities).toHaveLength(3);
        expect(entities.map((e) => e.name)).toEqual(
          expect.arrayContaining(createdEntities.map((e) => e.name))
        );
      });
    });

    it('should find entities by condition', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const targetEntity = testEntityFactory.build({ name: 'Search Target' });
        const otherEntity = testEntityFactory.build({ name: 'Other Entity' });
        
        await Promise.all([
          service.create(targetEntity),
          service.create(otherEntity)
        ]);

        // Act
        const entities = await service.findAll({ name: 'Search Target' });

        // Assert
        expect(entities).toHaveLength(1);
        expect(entities[0]?.name).toBe('Search Target');
      });
    });
  });
}); 