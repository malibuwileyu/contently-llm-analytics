import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { QueryEntity } from './query.entity';
import { MentionEntity } from './mention.entity';

/**
 * Entity representing a response from an AI provider
 */
@Entity('responses')
export class ResponseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string; // The raw response text

  @Column({ length: 50 })
  @Index()
  provider: string; // The AI provider (e.g., _openai, _anthropic)

  @Column({ length: 100, nullable: true })
  model: string; // The model used (e.g., gpt-_4, claude-2)

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>; // Additional metadata about the response

  @Column({ type: 'float', nullable: true })
  processingTimeMs: number; // Time taken to get the response

  @Column({ type: 'float', nullable: true })
  cost: number; // Cost of the API call

  @Column()
  @Index()
  queryId: string;

  @ManyToOne(() => QueryEntity, query => query.responses)
  @JoinColumn({ name: 'queryId' })
  query: QueryEntity;

  @OneToMany(() => MentionEntity, mention => mention.response)
  mentions: MentionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
