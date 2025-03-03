import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { AnswerMetadata } from '../entities/answer-metadata.entity';
import { CreateAnswerMetadataDto } from '../interfaces/answer-metadata.interface';

/**
 * Answer Metadata Repository
 *
 * Handles database operations for AnswerMetadata entities.
 */
@Injectable()
export class AnswerMetadataRepository {
  constructor(
    @InjectRepository(AnswerMetadata)
    private readonly repository: Repository<AnswerMetadata>,
  ) {}

  /**
   * Find metadata by ID
   *
   * @param id - The metadata ID
   * @returns The metadata entity or null if not found
   */
  async findById(id: string): Promise<AnswerMetadata | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Find metadata by answer ID
   *
   * @param answerId - The answer ID
   * @returns Array of metadata entities
   */
  async findByAnswerId(answerId: string): Promise<AnswerMetadata[]> {
    return this.repository.find({
      where: { answerId },
    });
  }

  /**
   * Find metadata by key and answer ID
   *
   * @param answerId - The answer ID
   * @param key - The metadata key
   * @returns The metadata entity or null if not found
   */
  async findByKeyAndAnswerId(
    answerId: string,
    key: string,
  ): Promise<AnswerMetadata | null> {
    return this.repository.findOne({
      where: { answerId, key },
    });
  }

  /**
   * Create new metadata
   *
   * @param data - Metadata data
   * @returns The created metadata entity
   */
  async create(data: CreateAnswerMetadataDto): Promise<AnswerMetadata> {
    const metadata = this.repository.create(data);
    return this.repository.save(metadata);
  }

  /**
   * Create multiple metadata entries
   *
   * @param dataArray - Array of metadata data
   * @returns Array of created metadata entities
   */
  async createMany(
    dataArray: CreateAnswerMetadataDto[],
  ): Promise<AnswerMetadata[]> {
    const metadataEntities = dataArray.map(data =>
      this.repository.create(data),
    );
    return this.repository.save(metadataEntities);
  }

  /**
   * Update metadata
   *
   * @param id - The metadata ID
   * @param data - Updated metadata data
   * @returns The updated metadata entity or null if not found
   */
  async update(
    id: string,
    data: Partial<AnswerMetadata>,
  ): Promise<AnswerMetadata | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Delete metadata
   *
   * @param id - The metadata ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  /**
   * Delete all metadata for an answer
   *
   * @param answerId - The answer ID
   * @returns True if deleted, false otherwise
   */
  async deleteByAnswerId(answerId: string): Promise<boolean> {
    const result = await this.repository.softDelete({
      answerId,
    } as FindOptionsWhere<AnswerMetadata>);
    return result.affected !== undefined && result.affected > 0;
  }
}
