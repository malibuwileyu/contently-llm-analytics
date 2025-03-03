import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { Answer } from './entities/answer.entity';
import { AnswerMetadata } from './entities/answer-metadata.entity';
import { AnswerValidation } from './entities/answer-validation.entity';
import { AnswerScore } from './entities/answer-score.entity';

// Services
import { AnswerGeneratorService } from './services/answer-generator.service';
import { AnswerValidatorService } from './services/answer-validator.service';
import { AnswerScoringService } from './services/answer-scoring.service';
import { AnswerAnalyticsService } from './services/answer-analytics.service';

// Repositories
import { AnswerRepository } from './repositories/answer.repository';
import { AnswerMetadataRepository } from './repositories/answer-metadata.repository';
import { AnswerValidationRepository } from './repositories/answer-validation.repository';

// Runners
import { AnswerGeneratorRunner } from './runners/answer-generator.runner';

// Validation Rules
import { RelevanceValidationRule } from './validation/rules/relevance-validation-rule';

/**
 * Answer Generator Module
 *
 * Responsible for:
 * - Generating AI-powered answers based on search queries
 * - Validating answer quality and relevance
 * - Scoring answers based on predefined metrics
 * - Storing answer data for analytics
 *
 * Implementation Checklist:
 * - [x] Module structure
 * - [x] Entity definitions
 * - [x] Repository implementations
 * - [x] Service implementations
 * - [x] Runner implementation
 * - [ ] Integration with AI Provider module
 * - [ ] Integration with Analytics module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Answer,
      AnswerMetadata,
      AnswerValidation,
      AnswerScore,
    ]),
  ],
  providers: [
    // Services
    AnswerGeneratorService,
    AnswerValidatorService,
    AnswerScoringService,
    AnswerAnalyticsService,

    // Repositories
    AnswerRepository,
    AnswerMetadataRepository,
    AnswerValidationRepository,

    // Runners
    AnswerGeneratorRunner,

    // Validation Rules
    RelevanceValidationRule,
  ],
  exports: [
    AnswerGeneratorRunner,
    AnswerGeneratorService,
    AnswerValidatorService,
    AnswerScoringService,
    AnswerAnalyticsService,
  ],
})
export class AnswerGeneratorModule {}
