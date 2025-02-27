import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  DeepPartial,
} from 'typeorm';
import { BaseEntity } from '../entities/base.entity';

/**
 * Base service class providing common CRUD operations
 * @template T - Entity type extending BaseEntity
 */
@Injectable()
export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Find an entity by ID
   * @param id - Entity ID
   * @param options - Find options
   * @throws {NotFoundException} When entity is not found
   */
  async findById(id: string, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id },
      ...options,
    } as FindOneOptions<T>);

    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }

    return entity;
  }

  /**
   * Create a new entity
   * @param data - Entity data
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  /**
   * Update an existing entity
   * @param id - Entity ID
   * @param data - Updated entity data
   * @throws {NotFoundException} When entity is not found
   */
  async update(id: string, data: DeepPartial<T>): Promise<T> {
    // Using type assertion to bypass TypeORM's complex type requirements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  /**
   * Soft delete an entity
   * @param id - Entity ID
   * @throws {NotFoundException} When entity is not found
   */
  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }

  /**
   * Find all entities
   * @param options - Find options
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await this.repository.restore(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }
}
