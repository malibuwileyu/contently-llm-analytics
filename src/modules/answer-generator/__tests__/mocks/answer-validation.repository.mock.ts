import { Injectable } from '@nestjs/common';
import {
  AnswerValidation,
  ValidationResultType,
  ValidationStatus,
} from '../../entities/answer-validation.entity';

/**
 * Mock implementation of AnswerValidationRepository for testing
 */
@Injectable()
export class MockAnswerValidationRepository {
  create = jest
    .fn()
    .mockImplementation((validation: Partial<AnswerValidation>) => {
      return {
        id: 'mock-validation-id',
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Validation passed',
        confidence: 0.9,
        ...validation,
      } as AnswerValidation;
    });

  save = jest
    .fn()
    .mockImplementation((validation: Partial<AnswerValidation>) => {
      return Promise.resolve({
        id: 'mock-validation-id',
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Validation passed',
        confidence: 0.9,
        ...validation,
      } as AnswerValidation);
    });

  find = jest.fn().mockResolvedValue([]);

  findOne = jest.fn().mockResolvedValue({
    id: 'mock-validation-id',
    validationType: ValidationResultType.RELEVANCE,
    status: ValidationStatus.PASSED,
    message: 'Validation passed',
    confidence: 0.9,
  } as AnswerValidation);

  createValidation = jest
    .fn()
    .mockImplementation((validation: Partial<AnswerValidation>) => {
      return Promise.resolve({
        id: 'mock-validation-id',
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Validation passed',
        confidence: 0.9,
        ...validation,
      } as AnswerValidation);
    });

  findByAnswerId = jest.fn().mockImplementation((answerId: string) => {
    return Promise.resolve([
      {
        id: 'mock-validation-id',
        answerId,
        validationType: ValidationResultType.RELEVANCE,
        status: ValidationStatus.PASSED,
        message: 'Validation passed',
        confidence: 0.9,
      } as AnswerValidation,
    ]);
  });
}
