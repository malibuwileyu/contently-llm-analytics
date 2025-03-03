import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { AnswerMetadata } from './answer-metadata.entity';
import { AnswerValidation } from './answer-validation.entity';
import { AnswerScore } from './answer-score.entity';

/**
 * Answer Entity
 *
 * Represents a generated answer from an AI provider based on a search query.
 * Stores the answer content, source query, and related metadata.
 */
@Entity('answers')
export class Answer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  queryId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255 })
  provider: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
    transformer: {
      to: (value: Record<string, any>) => value,
      from: (value: Record<string, any> | string) => {
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch (e) {
            return value;
          }
        }
        return value;
      },
    },
  })
  providerMetadata: Record<string, any>;

  @Column({ type: 'float', default: 0 })
  relevanceScore: number;

  @Column({ type: 'float', default: 0 })
  accuracyScore: number;

  @Column({ type: 'float', default: 0 })
  completenessScore: number;

  @Column({ type: 'float', default: 0 })
  overallScore: number;

  @Column({ type: 'boolean', default: false })
  isValidated: boolean;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status: 'pending' | 'validated' | 'rejected';

  @OneToMany(() => AnswerMetadata, metadata => metadata.answer)
  metadata: AnswerMetadata[];

  @OneToMany(() => AnswerValidation, validation => validation.answer)
  validations: AnswerValidation[];

  @OneToMany(() => AnswerScore, score => score.answer)
  scores: AnswerScore[];

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    nullable: true,
  })
  deletedAt: Date;
}
