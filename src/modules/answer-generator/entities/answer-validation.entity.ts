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
 * Validation result types for answer validation
 */
export enum ValidationResultType {
  FACTUAL_ACCURACY = 'factual_accuracy',
  RELEVANCE = 'relevance',
  COMPLETENESS = 'completeness',
  BRAND_SAFETY = 'brand_safety',
  CITATION = 'citation',
}

/**
 * Validation status for answer validation
 */
export enum ValidationStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
}

/**
 * Entity representing validation results for an answer
 */
@Entity('answer_validations')
export class AnswerValidation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Answer, answer => answer.validations)
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Column({ name: 'answer_id' })
  answerId: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum',
    enum: ValidationResultType,
    name: 'validation_type',
  })
  validationType: ValidationResultType;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'varchar' : 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.PASSED,
  })
  status: ValidationStatus;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({
    type: process.env.NODE_ENV === 'test' ? 'simple-json' : 'jsonb',
    nullable: true,
    name: 'validation_details',
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
  validationDetails: Record<string, any>;

  @Column({ type: 'float', default: 1.0 })
  confidence: number;

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
