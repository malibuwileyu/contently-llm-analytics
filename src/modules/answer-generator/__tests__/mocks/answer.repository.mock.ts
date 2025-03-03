import { Answer } from '../../entities/answer.entity';

/**
 * Mock implementation of AnswerRepository for testing
 */
export class MockAnswerRepository {
  create = jest.fn().mockImplementation((data: Partial<Answer>) => {
    return {
      id: 'mock-answer-id',
      ...data,
    } as Answer;
  });

  save = jest.fn().mockImplementation((data: Partial<Answer>) => {
    return Promise.resolve({
      id: 'mock-answer-id',
      ...data,
    } as Answer);
  });

  findById = jest.fn().mockResolvedValue({
    id: 'mock-answer-id',
  } as Answer);

  findAll = jest.fn().mockResolvedValue([]);

  update = jest.fn().mockResolvedValue(true);

  find = jest.fn().mockResolvedValue([]);

  findOne = jest.fn().mockResolvedValue({
    id: 'mock-answer-id',
  } as Answer);
}
