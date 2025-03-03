import { Injectable, Logger } from '@nestjs/common';
import { AnswerGeneratorService } from '../services/answer-generator.service';
import { AnswerValidatorService } from '../services/answer-validator.service';
import { AnswerScoringService } from '../services/answer-scoring.service';
import { GenerateAnswerDto } from '../dto/generate-answer.dto';
import { Answer } from '../entities/answer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/**
 * Answer Generator Runner
 *
 * Orchestrates the answer generation process.
 * Follows the runner pattern for clean orchestration of dependencies.
 */
@Injectable()
export class AnswerGeneratorRunner {
  private readonly logger = new Logger(AnswerGeneratorRunner.name);

  constructor(
    private readonly answerGeneratorService: AnswerGeneratorService,
    private readonly answerValidatorService: AnswerValidatorService,
    private readonly answerScoringService: AnswerScoringService,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  /**
   * Run the answer generation process
   *
   * @param dto - Generate answer DTO
   * @returns The generated answer
   */
  async run(dto: GenerateAnswerDto): Promise<Answer> {
    try {
      this.logger.log(`Running answer generation for query ID: ${dto.queryId}`);

      // Generate the answer
      let answer = await this.answerGeneratorService.generateAnswer(dto);

      // Validate the answer
      const validationResults =
        await this.answerValidatorService.validateAnswerWithRules(
          answer,
          dto.query,
        );

      // Score the answer
      answer = await this.answerScoringService.scoreAndSaveAnswer(
        answer,
        dto.query,
      );

      // Update answer status based on validation results
      const hasFailures = validationResults.some(
        validation => validation.status === 'failed',
      );

      answer.isValidated = true;
      answer.status = hasFailures ? 'rejected' : 'validated';

      // Save the updated answer
      answer = await this.answerRepository.save(answer);

      this.logger.log(
        `Answer generation completed for query ID: ${dto.queryId}`,
      );

      return answer;
    } catch (error) {
      this.logger.error(
        `Error in answer generation runner: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate multiple answers for a query
   *
   * @param dto - Generate answer DTO
   * @param count - Number of answers to generate
   * @returns Array of generated answers
   */
  async runMultiple(dto: GenerateAnswerDto, count: number): Promise<Answer[]> {
    try {
      this.logger.log(
        `Running multiple answer generation (${count}) for query ID: ${dto.queryId}`,
      );

      const answers: Answer[] = [];

      // Generate multiple answers with slight variations
      for (let i = 0; i < count; i++) {
        // Vary the temperature slightly for each generation
        const temperature = dto.temperature
          ? Math.min(
              1,
              Math.max(0, dto.temperature + (Math.random() * 0.2 - 0.1)),
            )
          : 0.7 + (Math.random() * 0.2 - 0.1);

        const modifiedDto = {
          ...dto,
          temperature,
        };

        const answer = await this.run(modifiedDto);
        answers.push(answer);
      }

      this.logger.log(
        `Multiple answer generation completed for query ID: ${dto.queryId}`,
      );

      return answers;
    } catch (error) {
      this.logger.error(
        `Error in multiple answer generation runner: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Generate, validate, and score the best answer from multiple generations
   *
   * @param dto - Generate answer DTO
   * @param count - Number of answers to generate
   * @returns The best answer based on overall score
   */
  async runBest(dto: GenerateAnswerDto, count = 3): Promise<Answer> {
    try {
      this.logger.log(
        `Running best answer generation for query ID: ${dto.queryId}`,
      );

      // Generate multiple answers
      const answers = await this.runMultiple(dto, count);

      // Find the answer with the highest overall score
      let bestAnswer = answers[0];
      for (const answer of answers) {
        if (answer.overallScore > bestAnswer.overallScore) {
          bestAnswer = answer;
        }
      }

      this.logger.log(
        `Best answer generation completed for query ID: ${dto.queryId}`,
      );

      return bestAnswer;
    } catch (error) {
      this.logger.error(
        `Error in best answer generation runner: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
