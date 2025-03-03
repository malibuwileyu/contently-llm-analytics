import { AnswerScore } from '../../entities/answer-score.entity';

/**
 * Mock implementation of AnswerScoreRepository for testing
 */
export class MockAnswerScoreRepository {
  create = jest.fn().mockImplementation((data: Partial<AnswerScore>) => {
    return {
      id: 'mock-score-id',
      ...data,
    } as AnswerScore;
  });

  save = jest.fn().mockImplementation((data: Partial<AnswerScore>) => {
    return Promise.resolve({
      id: 'mock-score-id',
      ...data,
    } as AnswerScore);
  });

  findByAnswerId = jest.fn().mockImplementation((answerId: string) => {
    return Promise.resolve([
      {
        id: 'mock-score-id',
        answerId,
      } as AnswerScore,
    ]);
  });

  find = jest.fn().mockResolvedValue([]);

  findOne = jest.fn().mockResolvedValue({
    id: 'mock-score-id',
  } as AnswerScore);
}
