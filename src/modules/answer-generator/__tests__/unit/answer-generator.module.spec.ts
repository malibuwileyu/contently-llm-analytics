import { Test } from '@nestjs/testing';
import { AnswerGeneratorModule } from '../../answer-generator.module';
import { AnswerGeneratorService } from '../../services/answer-generator.service';
import { AnswerValidatorService } from '../../services/answer-validator.service';
import { AnswerScoringService } from '../../services/answer-scoring.service';
import { AnswerGeneratorRunner } from '../../runners/answer-generator.runner';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Answer } from '../../entities/answer.entity';
import { AnswerMetadata } from '../../entities/answer-metadata.entity';
import { AnswerValidation } from '../../entities/answer-validation.entity';
import { AnswerScore } from '../../entities/answer-score.entity';
import { ConfigModule } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { AnswerValidationRepository } from '../../repositories/answer-validation.repository';
import { MockAnswerValidationRepository } from '../mocks/answer-validation.repository.mock';

describe('AnswerGeneratorModule', () => {
  let module: any;

  beforeEach(async () => {
    // Create mock repositories
    const mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Create mock DataSource
    const mockDataSource = {
      createEntityManager: jest.fn(() => ({
        find: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
      })),
    };

    // Create a test module with the AnswerGeneratorModule
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AnswerGeneratorModule,
      ],
    })
      .overrideProvider(getRepositoryToken(Answer))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(AnswerMetadata))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(AnswerValidation))
      .useValue(mockRepository)
      .overrideProvider(getRepositoryToken(AnswerScore))
      .useValue(mockRepository)
      .overrideProvider(DataSource)
      .useValue(mockDataSource)
      .overrideProvider(AnswerValidationRepository)
      .useClass(MockAnswerValidationRepository)
      .compile();

    module = moduleRef;
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide AnswerGeneratorService', () => {
    const service = module.get(AnswerGeneratorService);
    expect(service).toBeDefined();
  });

  it('should provide AnswerValidatorService', () => {
    const service = module.get(AnswerValidatorService);
    expect(service).toBeDefined();
  });

  it('should provide AnswerScoringService', () => {
    const service = module.get(AnswerScoringService);
    expect(service).toBeDefined();
  });

  it('should provide AnswerGeneratorRunner', () => {
    const runner = module.get(AnswerGeneratorRunner);
    expect(runner).toBeDefined();
  });
});
