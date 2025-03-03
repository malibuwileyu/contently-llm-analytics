import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Answer } from './answer.entity';

/**
 * Score metric types for answer scoring
 */
export enum ScoreMetricType {
  RELEVANCE = 'relevance',
  ACCURACY = 'accuracy',
  COMPLETENESS = 'completeness',
  HELPFULNESS = 'helpfulness',
  BRAND_ALIGNMENT = 'brand_alignment',
  OVERALL = 'overall',
}

/**
 * Entity representing scoring metrics for an answer
 */
@Entity('answer_scores')
export class AnswerScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Answer, answer => answer.scores)
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Column({ name: 'answer_id' })
  answerId: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum',
    enum: ScoreMetricType,
    name: 'metric_type',
  })
  metricType: ScoreMetricType;

  @Column({ type: 'float', default: 0.0 })
  score: number;

  @Column({ type: 'float', default: 1.0 })
  weight: number;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
    name: 'score_details',
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
  scoreDetails: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  explanation: string;

  @CreateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: process.env.NODE_ENV === 'test' ? 'datetime' : 'timestamp',
    name: 'updated_at',
  })
  updatedAt: Date;
}
