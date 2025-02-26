import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TestEntity } from './test.entity';
import { TestService } from './test.service';
import { createMockRepository } from '../test-utils';

describe('BaseService', () => {
  let service: TestService;
  let repository: Repository<TestEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestService,
        {
          provide: getRepositoryToken(TestEntity),
          useFactory: createMockRepository,
        },
      ],
    }).compile();

    service = module.get<TestService>(TestService);
    repository = module.get<Repository<TestEntity>>(getRepositoryToken(TestEntity));
  });

  describe('findById', () => {
    it('should return an entity if found', async () => {
      const testEntity = { id: '1', name: 'Test' } as TestEntity;
      jest.spyOn(repository, 'findOne').mockResolvedValue(testEntity);

      const result = await service.findById('1');
      expect(result).toBe(testEntity);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if entity not found', async () => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new entity', async () => {
      const createDto = { name: 'New Entity' };
      const createdEntity = { id: '1', ...createDto } as TestEntity;

      jest.spyOn(repository, 'create').mockReturnValue(createdEntity);
      jest.spyOn(repository, 'save').mockResolvedValue(createdEntity);

      const result = await service.create(createDto);

      expect(result).toBe(createdEntity);
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(createdEntity);
    });
  });

  describe('update', () => {
    it('should update and return the entity if found', async () => {
      const updateDto = { name: 'Updated Name' };
      const updatedEntity = { id: '1', ...updateDto } as TestEntity;

      const updateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: []
      };

      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);
      jest.spyOn(repository, 'findOne').mockResolvedValue(updatedEntity);

      const result = await service.update('1', updateDto);

      expect(result).toBe(updatedEntity);
      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw NotFoundException if entity not found during update', async () => {
      const updateResult: UpdateResult = {
        affected: 0,
        raw: [],
        generatedMaps: []
      };

      jest.spyOn(repository, 'update').mockResolvedValue(updateResult);

      await expect(service.update('1', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete the entity if found', async () => {
      const deleteResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: []
      };

      jest.spyOn(repository, 'softDelete').mockResolvedValue(deleteResult);

      await service.delete('1');

      expect(repository.softDelete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if entity not found during delete', async () => {
      const deleteResult: UpdateResult = {
        affected: 0,
        raw: [],
        generatedMaps: []
      };

      jest.spyOn(repository, 'softDelete').mockResolvedValue(deleteResult);

      await expect(service.delete('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return an array of entities', async () => {
      const entities = [
        { id: '1', name: 'First' },
        { id: '2', name: 'Second' },
      ] as TestEntity[];

      jest.spyOn(repository, 'find').mockResolvedValue(entities);

      const result = await service.findAll();

      expect(result).toBe(entities);
      expect(repository.find).toHaveBeenCalledWith({ where: undefined });
    });

    it('should apply where conditions when provided', async () => {
      const where = { name: 'Test' };
      jest.spyOn(repository, 'find').mockResolvedValue([]);

      await service.findAll(where);

      expect(repository.find).toHaveBeenCalledWith({ where });
    });
  });
}); 