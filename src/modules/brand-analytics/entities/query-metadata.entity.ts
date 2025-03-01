import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BusinessCategoryEntity } from './business-category.entity';
import { QueryIntentType } from '../dto/query-categorization.dto';

/**
 * Entity for storing query metadata
 */
@Entity('query_metadata')
export class QueryMetadataEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  @Index()
  query: string;

  @Column({ type: 'enum', enum: QueryIntentType, nullable: true })
  @Index()
  intent: QueryIntentType;

  @Column({ type: 'float', nullable: true })
  confidence: number;

  @Column('simple-array', { nullable: true })
  topics: string[];

  @Column('simple-array', { nullable: true })
  entities: string[];

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('simple-array', { nullable: true })
  brandMentions: string[];

  @Column('simple-array', { nullable: true })
  productCategories: string[];

  @Column('simple-array', { nullable: true })
  features: string[];

  @Column({ type: 'float', nullable: true })
  sentiment: number;

  @Column({ nullable: true })
  @Index()
  businessCategoryId: string;

  @ManyToOne(() => BusinessCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'businessCategoryId' })
  businessCategory: BusinessCategoryEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
