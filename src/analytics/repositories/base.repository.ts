import { Repository, DeepPartial, FindOneOptions } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  /**
   * Create a new entity
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity as DeepPartial<T>);
  }

  /**
   * Clear all entities
   */
  async clear(): Promise<void> {
    await this.repository.clear();
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  /**
   * Save multiple entities
   */
  async saveMany(entities: DeepPartial<T>[]): Promise<T[]> {
    const created = this.repository.create(entities);
    return this.repository.save(created);
  }

  /**
   * Update an entity
   */
  async update(id: string, data: DeepPartial<T>): Promise<void> {
    await this.repository.update(id, data as any);
  }

  async findOne(options: any): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async find(options: any): Promise<T[]> {
    return this.repository.find(options);
  }

  async count(options: any): Promise<number> {
    return this.repository.count(options);
  }

  async createAndSave(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async save(entity: T): Promise<T> {
    return this.repository.save(entity);
  }
}
