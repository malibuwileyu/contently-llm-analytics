import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Answer } from '../entities/answer.entity';
import { AnswerScore, ScoreMetricType } from '../entities/answer-score.entity';

/**
 * Answer Scoring Service
 *
 * Responsible for scoring generated answers based on various metrics.
 */
@Injectable()
export class AnswerScoringService {
  private readonly logger = new Logger(AnswerScoringService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AnswerScore)
    private readonly scoreRepository: Repository<AnswerScore>,
  ) {}

  /**
   * Score an answer based on multiple metrics
   *
   * @param content - The answer content
   * @param query - The original query
   * @returns Object containing scores for different metrics
   */
  async scoreAnswer(
    content: string,
    query: string,
  ): Promise<{
    relevance: number;
    accuracy: number;
    completeness: number;
    overall: number;
  }> {
    try {
      this.logger.log(`Scoring answer for query: ${query}`);

      // Calculate individual scores
      const relevanceScore = await this.calculateRelevanceScore(content, query);
      const accuracyScore = await this.calculateAccuracyScore(content);
      const completenessScore = await this.calculateCompletenessScore(
        content,
        query,
      );

      // Calculate overall score (weighted average)
      const relevanceWeight = this.configService.get<number>(
        'SCORE_WEIGHT_RELEVANCE',
        0.4,
      );
      const accuracyWeight = this.configService.get<number>(
        'SCORE_WEIGHT_ACCURACY',
        0.4,
      );
      const completenessWeight = this.configService.get<number>(
        'SCORE_WEIGHT_COMPLETENESS',
        0.2,
      );

      const overallScore =
        relevanceScore * relevanceWeight +
        accuracyScore * accuracyWeight +
        completenessScore * completenessWeight;

      return {
        relevance: parseFloat(relevanceScore.toFixed(2)),
        accuracy: parseFloat(accuracyScore.toFixed(2)),
        completeness: parseFloat(completenessScore.toFixed(2)),
        overall: parseFloat(overallScore.toFixed(2)),
      };
    } catch (error) {
      this.logger.error(`Error scoring answer: ${error.message}`, error.stack);

      // Return default scores in case of error
      return {
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        overall: 0,
      };
    }
  }

  /**
   * Score an answer and store the scores in the database
   *
   * @param answer - The answer entity to score
   * @param queryText - The original query text
   * @returns The updated answer with scores
   */
  async scoreAndSaveAnswer(answer: Answer, queryText: string): Promise<Answer> {
    try {
      this.logger.log(`Scoring and saving answer ${answer.id}`);

      // Calculate scores
      const scores = await this.scoreAnswer(answer.content, queryText);

      // Create and save score entities
      const scoreEntities: AnswerScore[] = [];

      // Relevance score
      const relevanceScore = this.scoreRepository.create({
        answerId: answer.id,
        metricType: ScoreMetricType.RELEVANCE,
        score: scores.relevance,
        weight: this.configService.get<number>('SCORE_WEIGHT_RELEVANCE', 0.4),
        explanation: 'Relevance score based on query term matching',
      });
      scoreEntities.push(await this.scoreRepository.save(relevanceScore));

      // Accuracy score
      const accuracyScore = this.scoreRepository.create({
        answerId: answer.id,
        metricType: ScoreMetricType.ACCURACY,
        score: scores.accuracy,
        weight: this.configService.get<number>('SCORE_WEIGHT_ACCURACY', 0.4),
        explanation: 'Accuracy score based on factual correctness',
      });
      scoreEntities.push(await this.scoreRepository.save(accuracyScore));

      // Completeness score
      const completenessScore = this.scoreRepository.create({
        answerId: answer.id,
        metricType: ScoreMetricType.COMPLETENESS,
        score: scores.completeness,
        weight: this.configService.get<number>(
          'SCORE_WEIGHT_COMPLETENESS',
          0.2,
        ),
        explanation: 'Completeness score based on answer structure and length',
      });
      scoreEntities.push(await this.scoreRepository.save(completenessScore));

      // Overall score
      const overallScore = this.scoreRepository.create({
        answerId: answer.id,
        metricType: ScoreMetricType.OVERALL,
        score: scores.overall,
        weight: 1.0,
        explanation:
          'Overall score based on weighted average of individual scores',
      });
      scoreEntities.push(await this.scoreRepository.save(overallScore));

      // Update answer entity with scores
      answer.relevanceScore = scores.relevance;
      answer.accuracyScore = scores.accuracy;
      answer.completenessScore = scores.completeness;
      answer.overallScore = scores.overall;

      return answer;
    } catch (error) {
      this.logger.error(
        `Error scoring and saving answer: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate relevance score
   *
   * @param content - The answer content
   * @param query - The original query
   * @returns Relevance score (0-1)
   */
  private async calculateRelevanceScore(
    content: string,
    query: string,
  ): Promise<number> {
    // TODO: Implement actual relevance scoring algorithm
    // This is a mock implementation for now

    // Basic implementation: check if query terms appear in the content
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 3);
    const contentLower = content.toLowerCase();

    let matchCount = 0;
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matchCount++;
      }
    }

    // Calculate score based on percentage of query terms found in content
    const score = queryTerms.length > 0 ? matchCount / queryTerms.length : 0.5;

    // Add some randomness for the mock implementation
    return Math.min(1, Math.max(0, score * 0.7 + Math.random() * 0.3));
  }

  /**
   * Calculate accuracy score
   *
   * @param content - The answer content
   * @returns Accuracy score (0-1)
   */
  private async calculateAccuracyScore(content: string): Promise<number> {
    // TODO: Implement actual accuracy scoring algorithm
    // This is a mock implementation for now

    // In a real implementation, this would check facts against a knowledge base
    // or use an AI model to evaluate factual accuracy

    // For now, return a random score between 0.6 and 1.0
    return 0.6 + Math.random() * 0.4;
  }

  /**
   * Calculate completeness score
   *
   * @param content - The answer content
   * @param query - The original query
   * @returns Completeness score (0-1)
   */
  private async calculateCompletenessScore(
    content: string,
    query: string,
  ): Promise<number> {
    // TODO: Implement actual completeness scoring algorithm
    // This is a mock implementation for now

    // Basic implementation: score based on answer length and structure

    // Length factor: longer answers tend to be more complete (up to a point)
    const idealLength = 500; // characters
    const lengthFactor = Math.min(1, content.length / idealLength);

    // Structure factor: check for sections, paragraphs, etc.
    const paragraphs = content.split(/\n\s*\n/).length;
    const structureFactor = Math.min(1, paragraphs / 3);

    // Combine factors
    const score = lengthFactor * 0.6 + structureFactor * 0.4;

    // Add some randomness for the mock implementation
    return Math.min(1, Math.max(0, score * 0.8 + Math.random() * 0.2));
  }
}
