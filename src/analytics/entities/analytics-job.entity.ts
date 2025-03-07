import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('analytics_jobs')
export class AnalyticsJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  job_type: string;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column('jsonb')
  metadata: {
    competitor_id: string;
    trigger_type: string;
    timestamp: string;
  };

  @Column({ type: 'text', nullable: true })
  error_message?: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at?: Date;
} 