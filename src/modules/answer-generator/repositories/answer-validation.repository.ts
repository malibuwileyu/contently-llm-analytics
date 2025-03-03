import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AnswerValidation } from '../entities/answer-validation.entity';

/**
 * Repository for managing answer validation records
 */
@Injectable()
export class AnswerValidationRepository extends Repository<AnswerValidation> {
  constructor(private dataSource: DataSource) {
    super(AnswerValidation, dataSource.createEntityManager());
  }

  /**
   * Creates a new answer validation record
   * @param validation The validation data to save
   * @returns The saved validation entity
   */
  async createValidation(
    validation: Partial<AnswerValidation>,
  ): Promise<AnswerValidation> {
    const newValidation = this.create(validation);
    return this.save(newValidation);
  }

  /**
   * Finds all validations for a specific answer
   * @param answerId The ID of the answer
   * @returns Array of validation records
   */
  async findByAnswerId(answerId: string): Promise<AnswerValidation[]> {
    return this.find({
      where: { answerId },
      order: { createdAt: 'DESC' },
    });
  }
}
