import { AnswerMetadata } from '../../entities/answer-metadata.entity';

/**
 * Mock implementation of AnswerMetadataRepository for testing
 */
export class MockAnswerMetadataRepository {
  create = jest.fn().mockImplementation((data: Partial<AnswerMetadata>) => {
    return {
      id: 'mock-metadata-id',
      ...data,
    } as AnswerMetadata;
  });

  save = jest.fn().mockImplementation((data: Partial<AnswerMetadata>) => {
    return Promise.resolve({
      id: 'mock-metadata-id',
      ...data,
    } as AnswerMetadata);
  });

  createMany = jest
    .fn()
    .mockImplementation((dataArray: Partial<AnswerMetadata>[]) => {
      return Promise.resolve(
        dataArray.map(data => ({
          id: 'mock-metadata-id',
          ...data,
        })),
      );
    });

  findByAnswerId = jest.fn().mockImplementation((answerId: string) => {
    return Promise.resolve([
      {
        id: 'mock-metadata-id',
        answerId,
      } as AnswerMetadata,
    ]);
  });

  find = jest.fn().mockResolvedValue([]);

  findOne = jest.fn().mockResolvedValue({
    id: 'mock-metadata-id',
  } as AnswerMetadata);
}
