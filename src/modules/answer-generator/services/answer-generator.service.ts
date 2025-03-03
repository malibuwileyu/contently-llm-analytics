import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnswerRepository } from '../repositories/answer.repository';
import { AnswerMetadataRepository } from '../repositories/answer-metadata.repository';
import { GenerateAnswerDto } from '../dto/generate-answer.dto';
import { AnswerValidatorService } from './answer-validator.service';
import { AnswerScoringService } from './answer-scoring.service';
import {
  CreateAnswerDto,
  AnswerGenerationOptions,
} from '../interfaces/answer.interface';
import { Answer } from '../entities/answer.entity';
import {
  AnswerCitation,
  CreateAnswerMetadataDto,
} from '../interfaces/answer-metadata.interface';

/**
 * Answer Generator Service
 *
 * Responsible for generating answers from AI providers based on search queries.
 */
@Injectable()
export class AnswerGeneratorService {
  private readonly logger = new Logger(AnswerGeneratorService.name);
  private readonly defaultProvider: string;
  private readonly defaultMaxTokens: number;
  private readonly defaultTemperature: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly answerRepository: AnswerRepository,
    private readonly metadataRepository: AnswerMetadataRepository,
    private readonly validatorService: AnswerValidatorService,
    private readonly scoringService: AnswerScoringService,
  ) {
    this.defaultProvider = this.configService.get<string>(
      'AI_PROVIDER',
      'openai',
    );
    this.defaultMaxTokens = this.configService.get<number>(
      'AI_MAX_TOKENS',
      1000,
    );
    this.defaultTemperature = this.configService.get<number>(
      'AI_TEMPERATURE',
      0.7,
    );
  }

  /**
   * Generate an answer for a query
   *
   * @param dto - Generate answer DTO
   * @returns The generated answer
   */
  async generateAnswer(dto: GenerateAnswerDto): Promise<Answer> {
    try {
      this.logger.log(`Generating answer for query ID: ${dto.queryId}`);

      const options: AnswerGenerationOptions = {
        provider: dto.provider || this.defaultProvider,
        maxTokens: dto.maxTokens || this.defaultMaxTokens,
        temperature: dto.temperature || this.defaultTemperature,
        includeMetadata:
          dto.includeMetadata !== undefined ? dto.includeMetadata : true,
        validateAnswer:
          dto.validateAnswer !== undefined ? dto.validateAnswer : true,
      };

      // Generate answer from AI provider
      const { content, provider, providerMetadata } = await this.callAIProvider(
        dto.query,
        options,
      );

      // Create answer entity
      const answerData: CreateAnswerDto = {
        queryId: dto.queryId,
        content,
        provider,
        providerMetadata,
      };

      const answer = await this.answerRepository.create(answerData);

      // Extract and store citations if available
      if (options.includeMetadata && providerMetadata?.citations) {
        await this.storeCitations(answer.id, providerMetadata.citations);
      }

      // Validate and score the answer if requested
      if (options.validateAnswer) {
        await this.validateAndScoreAnswer(answer.id, dto.query, content);
      }

      // Return the complete answer with metadata
      const result = await this.answerRepository.findById(answer.id);
      if (!result) {
        throw new Error(`Failed to retrieve answer with ID: ${answer.id}`);
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating answer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Call AI provider to generate an answer
   *
   * @param query - The search query
   * @param options - Generation options
   * @returns The generated answer
   */
  private async callAIProvider(
    query: string,
    options: AnswerGenerationOptions,
  ): Promise<{
    content: string;
    provider: string;
    providerMetadata?: Record<string, any>;
  }> {
    // TODO: Implement actual AI provider integration
    // This is a mock implementation for now
    this.logger.log(
      `Calling AI provider: ${options.provider || this.defaultProvider}`,
    );

    // Mock response
    return {
      content: `This is a mock answer for the query: "${query}"`,
      provider: options.provider || this.defaultProvider,
      providerMetadata: {
        model: 'mock-model',
        tokens: 50,
        citations: [
          {
            source: 'Mock Source 1',
            text: 'This is a mock citation',
            url: 'https://example.com/source1',
            authority: 0.8,
          },
        ],
      },
    };
  }

  /**
   * Store citations as metadata
   *
   * @param answerId - The answer ID
   * @param citations - Array of citations
   */
  private async storeCitations(
    answerId: string,
    citations: AnswerCitation[],
  ): Promise<void> {
    try {
      const metadataEntries: CreateAnswerMetadataDto[] = citations.map(
        (citation, index) => ({
          answerId,
          key: `citation_${index}`,
          valueType: 'json' as const,
          jsonValue: citation,
        }),
      );

      await this.metadataRepository.createMany(metadataEntries);
    } catch (error) {
      this.logger.error(
        `Error storing citations: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Validate and score an answer
   *
   * @param answerId - The answer ID
   * @param query - The original query
   * @param content - The answer content
   */
  private async validateAndScoreAnswer(
    answerId: string,
    query: string,
    content: string,
  ): Promise<void> {
    try {
      // Validate the answer
      const validationResult = await this.validatorService.validateAnswer(
        content,
        query,
      );

      // Score the answer
      const scores = await this.scoringService.scoreAnswer(content, query);

      // Update the answer with validation and scoring results
      await this.answerRepository.update(answerId, {
        isValidated: validationResult.isValid,
        status: validationResult.isValid ? 'validated' : 'rejected',
        relevanceScore: scores.relevance,
        accuracyScore: scores.accuracy,
        completenessScore: scores.completeness,
        overallScore: scores.overall,
      });

      // Store validation reasons as metadata if available
      if (validationResult.reasons && validationResult.reasons.length > 0) {
        await this.metadataRepository.create({
          answerId,
          key: 'validation_reasons',
          valueType: 'json' as const,
          jsonValue: { reasons: validationResult.reasons },
        });
      }
    } catch (error) {
      this.logger.error(
        `Error validating answer: ${error.message}`,
        error.stack,
      );
    }
  }
}
