import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { AnswerRepository } from '../../repositories/answer.repository';
import { Answer } from '../../entities/answer.entity';

describe('AnswerRepository', () => {
  let repository: AnswerRepository;
  let typeOrmRepository: Repository<Answer>;

  const mockTypeOrmRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerRepository,
        {
          provide: getRepositoryToken(Answer),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<AnswerRepository>(AnswerRepository);
    typeOrmRepository = module.get<Repository<Answer>>(
      getRepositoryToken(Answer),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new answer', async () => {
      const answerData = {
        queryId: 'test-query-id',
        content: 'Test answer content',
        provider: 'test-provider',
      };

      const createdAnswer = {
        id: 'test-id',
        ...answerData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTypeOrmRepository.create.mockReturnValue(createdAnswer);
      mockTypeOrmRepository.save.mockResolvedValue(createdAnswer);

      const result = await repository.create(answerData);

      expect(mockTypeOrmRepository.create).toHaveBeenCalledWith(answerData);
      expect(mockTypeOrmRepository.save).toHaveBeenCalledWith(createdAnswer);
      expect(result).toEqual(createdAnswer);
    });

    it('should handle errors during creation', async () => {
      const answerData = {
        queryId: 'test-query-id',
        content: 'Test answer content',
        provider: 'test-provider',
      };

      mockTypeOrmRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(repository.create(answerData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find an answer by id', async () => {
      const answerId = 'test-id';
      const answer = {
        id: answerId,
        queryId: 'test-query-id',
        content: 'Test answer content',
        provider: 'test-provider',
      };

      mockTypeOrmRepository.findOne.mockResolvedValue(answer);

      const result = await repository.findById(answerId);

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
        relations: ['metadata'],
      });
      expect(result).toEqual(answer);
    });

    it('should return null when answer is not found', async () => {
      const answerId = 'non-existent-id';

      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findById(answerId);

      expect(mockTypeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: answerId },
        relations: ['metadata'],
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an answer', async () => {
      const answerId = 'test-id';
      const updateData = {
        content: 'Updated content',
        relevanceScore: 0.8,
      };
      const updatedAnswer = {
        id: answerId,
        content: 'Updated content',
        relevanceScore: 0.8,
      };

      mockTypeOrmRepository.update.mockResolvedValue({ affected: 1 });
      mockTypeOrmRepository.findOne.mockResolvedValue(updatedAnswer);

      const result = await repository.update(answerId, updateData);

      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith(
        answerId,
        updateData,
      );
      expect(mockTypeOrmRepository.findOne).toHaveBeenCalled();
      expect(result).toEqual(updatedAnswer);
    });

    it('should return null when answer is not found after update', async () => {
      const answerId = 'non-existent-id';
      const updateData = {
        content: 'Updated content',
      };

      mockTypeOrmRepository.update.mockResolvedValue({ affected: 0 });
      mockTypeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update(answerId, updateData);

      expect(mockTypeOrmRepository.update).toHaveBeenCalledWith(
        answerId,
        updateData,
      );
      expect(result).toBeNull();
    });
  });

  describe('findByQueryId', () => {
    it('should find answers by query id', async () => {
      const queryId = 'test-query-id';
      const answers = [
        {
          id: 'answer-1',
          queryId,
          content: 'Answer 1',
          provider: 'test-provider',
        },
        {
          id: 'answer-2',
          queryId,
          content: 'Answer 2',
          provider: 'test-provider',
        },
      ];

      mockTypeOrmRepository.find.mockResolvedValue(answers);

      const result = await repository.findByQueryId(queryId);

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { queryId },
      });
      expect(result).toEqual(answers);
    });

    it('should accept additional options', async () => {
      const queryId = 'test-query-id';
      const options: Partial<FindManyOptions<Answer>> = {
        order: { createdAt: 'DESC' as const },
        take: 5,
      };

      mockTypeOrmRepository.find.mockResolvedValue([]);

      await repository.findByQueryId(queryId, options);

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: { queryId },
        ...options,
      });
    });
  });

  describe('findByCriteria', () => {
    it('should find answers by criteria', async () => {
      const criteria = { provider: 'test-provider' };
      const answers = [
        {
          id: 'answer-1',
          queryId: 'query-1',
          content: 'Answer 1',
          provider: 'test-provider',
        },
        {
          id: 'answer-2',
          queryId: 'query-2',
          content: 'Answer 2',
          provider: 'test-provider',
        },
      ];

      mockTypeOrmRepository.find.mockResolvedValue(answers);

      const result = await repository.findByCriteria(criteria);

      expect(mockTypeOrmRepository.find).toHaveBeenCalledWith({
        where: criteria,
      });
      expect(result).toEqual(answers);
    });
  });

  describe('delete', () => {
    it('should soft delete an answer', async () => {
      const answerId = 'test-id';

      mockTypeOrmRepository.softDelete.mockResolvedValue({ affected: 1 });

      const result = await repository.delete(answerId);

      expect(mockTypeOrmRepository.softDelete).toHaveBeenCalledWith(answerId);
      expect(result).toBe(true);
    });

    it('should return false when answer is not found', async () => {
      const answerId = 'non-existent-id';

      mockTypeOrmRepository.softDelete.mockResolvedValue({ affected: 0 });

      const result = await repository.delete(answerId);

      expect(mockTypeOrmRepository.softDelete).toHaveBeenCalledWith(answerId);
      expect(result).toBe(false);
    });
  });

  describe('getAverageScoresByQueryId', () => {
    it('should get average scores for a query', async () => {
      const queryId = 'test-query-id';
      const rawResult = {
        relevance: '0.85',
        accuracy: '0.9',
        completeness: '0.8',
        overall: '0.85',
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(rawResult),
      };

      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getAverageScoresByQueryId(queryId);

      expect(mockTypeOrmRepository.createQueryBuilder).toHaveBeenCalled();
      expect(queryBuilder.where).toHaveBeenCalledWith(
        'answer.queryId = :queryId',
        { queryId },
      );
      expect(result).toEqual({
        relevance: 0.85,
        accuracy: 0.9,
        completeness: 0.8,
        overall: 0.85,
      });
    });

    it('should handle null values in average scores', async () => {
      const queryId = 'test-query-id';
      const rawResult = {
        relevance: null,
        accuracy: null,
        completeness: null,
        overall: null,
      };

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(rawResult),
      };

      mockTypeOrmRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getAverageScoresByQueryId(queryId);

      expect(result).toEqual({
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        overall: 0,
      });
    });
  });
});
