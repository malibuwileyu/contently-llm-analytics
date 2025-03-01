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
import { QueryTemplateEntity } from './query-template.entity';
import { ResponseEntity } from './response.entity';

/**
 * Entity representing a generated query to be sent to AI providers
 */
@Entity('queries')
export class QueryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string; // The actual query text

  @Column({ length: 50 })
  @Index()
  status: string; // pending, running, completed, failed

  @Column('simple-json', { nullable: true })
  placeholderValues: Record<string, string>; // Values used for placeholders

  @Column({ length: 50, nullable: true })
  @Index()
  batchId: string; // ID of the batch this query belongs to

  @Column({ nullable: true })
  @Index()
  queryTemplateId: string;

  @ManyToOne(() => QueryTemplateEntity, template => template.queries)
  @JoinColumn({ name: 'queryTemplateId' })
  queryTemplate: QueryTemplateEntity;

  @OneToMany(() => ResponseEntity, response => response.query)
  responses: ResponseEntity[];

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ nullable: true })
  lastRunAt: Date;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>; // Additional metadata about the query

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
