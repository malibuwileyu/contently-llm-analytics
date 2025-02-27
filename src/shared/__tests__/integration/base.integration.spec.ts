import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { BaseService } from '../../classes/base.service';
import { BaseEntity } from '../../entities/base.entity';
import { NotFoundException } from '@nestjs/common';
import {
  createTestDatabaseModule,
  withTestTransaction,
} from '../../test-utils';

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
const createTestEntity = (overrides: Partial<TestEntity> = {}): Partial<TestEntity> => ({
  id: 'test-id',
  name: 'Test Name',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const createTestEntityList = (count: number, overrides: Partial<TestEntity> = {}): Partial<TestEntity>[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...createTestEntity(),
    id: `test-id-${index + 1}`,
    ...overrides,
  }));
};

describe('Base Integration Tests', () => {
  let module: TestingModule;
  let service: TestService;
  let repository: Repository<TestEntity>;

  beforeAll(async () => {
    const testDb = await createTestDatabaseModule([TestEntity]);
    module = await Test.createTestingModule({
      imports: [testDb],
      providers: [
        TestService,
        {
          provide: getRepositoryToken(TestEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<TestService>(TestService);
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
        const testData = createTestEntity();

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
        const entity = await service.create(createTestEntity());
        const updateData = createTestEntity({
          name: 'Updated Name',
          description: 'Updated Description',
        });

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
        const entity = await service.create(createTestEntity());

        // Act
        await service.delete(entity.id);

        // Assert
        await expect(service.findById(entity.id)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    it('should find all entities', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const testEntities = createTestEntityList(3);
        const createdEntities = await Promise.all(
          testEntities.map((entity) => service.create(entity)),
        );

        // Act
        const entities = await service.findAll();

        // Assert
        expect(entities).toHaveLength(3);
        expect(entities.map((e) => e.name)).toEqual(
          expect.arrayContaining(createdEntities.map((e) => e.name)),
        );
      });
    });

    it('should find entities by condition', async () => {
      await withTestTransaction(repository, async () => {
        // Arrange
        const targetEntity = await service.create(
          createTestEntity({ name: 'Search Target' }),
        );
        await service.create(
          createTestEntity({ name: 'Other Entity' }),
        );

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
});
