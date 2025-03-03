import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Answer } from './answer.entity';

/**
 * Answer Metadata Entity
 *
 * Stores additional metadata about generated answers,
 * such as citations, sources, and validation details.
 */
@Entity('answer_metadata')
export class AnswerMetadata {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  answerId: string;

  @Column({ type: 'varchar' })
  key: string;

  @Column({ type: 'text', nullable: true })
  textValue: string | null;

  @Column({ type: 'float', nullable: true })
  numericValue: number | null;

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
  jsonValue: Record<string, any> | null;

  @Column({ type: 'varchar' })
  valueType: 'text' | 'numeric' | 'json';

  @ManyToOne(() => Answer, answer => answer.metadata, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answerId' })
  answer: Answer;

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
  deletedAt: Date | null;
}
