import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BusinessCategoryEntity } from './business-category.entity';
import { CompetitorEntity } from './competitor.entity';

/**
 * Entity representing computed analytics results
 */
@Entity('analytics_results')
export class AnalyticsResultEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  @Index()
  type: string; // mention_frequency, _sentiment_analysis, _feature_association, etc.

  @Column({ length: 50 })
  @Index()
  timeFrame: string; // daily, weekly, monthly, all_time

  @Column({ type: 'date', nullable: true })
  @Index()
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  @Index()
  endDate: Date;

  @Column({ type: 'float' })
  value: number; // The computed value (e.g., mention _percentage)

  @Column({ type: 'int', nullable: true })
  rank: number; // Rank among competitors (if applicable)

  @Column({ type: 'int', nullable: true })
  totalMentions: number; // Total number of mentions

  @Column({ type: 'int', nullable: true })
  totalResponses: number; // Total number of responses analyzed

  @Column('simple-json', { nullable: true })
  additionalData: Record<string, any>; // Additional data specific to the analysis type

  @Column()
  @Index()
  businessCategoryId: string;

  @ManyToOne(() => BusinessCategoryEntity)
  @JoinColumn({ name: 'businessCategoryId' })
  businessCategory: BusinessCategoryEntity;

  @Column()
  @Index()
  competitorId: string;

  @ManyToOne(() => CompetitorEntity)
  @JoinColumn({ name: 'competitorId' })
  competitor: CompetitorEntity;

  @Column({ type: 'boolean', default: false })
  isStatisticallySignificant: boolean;

  @Column({ type: 'float', nullable: true })
  confidenceInterval: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
