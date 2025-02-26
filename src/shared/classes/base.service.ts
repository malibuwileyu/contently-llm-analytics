import { NotFoundException } from '@nestjs/common';
import { Repository, DeepPartial, FindOptionsWhere } from 'typeorm';
import { BaseEntity } from '../interfaces/base.interface';

/**
 * Base service class providing common CRUD operations
 * @template T - Entity type extending BaseEntity
 */
export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Find an entity by ID
   * @param id - Entity ID
   * @throws {NotFoundException} When entity is not found
   */
  async findById(id: string): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>
    });
    
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
    const result = await this.repository.update(id, data as any);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return this.findById(id);
  }

  /**
   * Soft delete an entity
   * @param id - Entity ID
   * @throws {NotFoundException} When entity is not found
   */
  async delete(id: string): Promise<void> {
    const result = await this.repository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }

  /**
   * Find all entities
   * @param where - Where conditions
   */
  async findAll(where?: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.find({ where });
  }
} 