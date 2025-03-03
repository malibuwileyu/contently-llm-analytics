import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { Answer } from '../entities/answer.entity';

/**
 * Answer Repository
 *
 * Handles database operations for Answer entities.
 */
@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly repository: Repository<Answer>,
  ) {}

  /**
   * Find an answer by ID
   *
   * @param id - The answer ID
   * @returns The answer entity or null if not found
   */
  async findById(id: string): Promise<Answer | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['metadata'],
    });
  }

  /**
   * Find answers by query ID
   *
   * @param queryId - The query ID
   * @param options - Additional find options
   * @returns Array of answer entities
   */
  async findByQueryId(
    queryId: string,
    options?: Partial<FindManyOptions<Answer>>,
  ): Promise<Answer[]> {
    return this.repository.find({
      where: { queryId },
      ...options,
    });
  }

  /**
   * Find answers by criteria
   *
   * @param criteria - Search criteria
   * @param options - Additional find options
   * @returns Array of answer entities
   */
  async findByCriteria(
    criteria: FindOptionsWhere<Answer>,
    options?: Partial<FindManyOptions<Answer>>,
  ): Promise<Answer[]> {
    return this.repository.find({
      where: criteria,
      ...options,
    });
  }

  /**
   * Create a new answer
   *
   * @param data - Answer data
   * @returns The created answer entity
   */
  async create(data: Partial<Answer>): Promise<Answer> {
    const answer = this.repository.create(data);
    return this.repository.save(answer);
  }

  /**
   * Update an answer
   *
   * @param id - The answer ID
   * @param data - Updated answer data
   * @returns The updated answer entity or null if not found
   */
  async update(id: string, data: Partial<Answer>): Promise<Answer | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  /**
   * Delete an answer
   *
   * @param id - The answer ID
   * @returns True if deleted, false otherwise
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.softDelete(id);
    return result.affected !== undefined && result.affected > 0;
  }

  /**
   * Get average scores for a query
   *
   * @param queryId - The query ID
   * @returns Object containing average scores
   */
  async getAverageScoresByQueryId(queryId: string): Promise<{
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('answer')
      .select('AVG(answer.relevanceScore)', 'relevance')
      .addSelect('AVG(answer.accuracyScore)', 'accuracy')
      .addSelect('AVG(answer.completenessScore)', 'completeness')
      .addSelect('AVG(answer.overallScore)', 'overall')
      .where('answer.queryId = :queryId', { queryId })
      .getRawOne();

    // Handle case when result is undefined or null
    if (!result) {
      return {
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        overall: 0,
      };
    }

    return {
      relevance: parseFloat(result.relevance) || 0,
      accuracy: parseFloat(result.accuracy) || 0,
      completeness: parseFloat(result.completeness) || 0,
      overall: parseFloat(result.overall) || 0,
    };
  }
}
