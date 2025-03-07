import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';

@Entity('company_profiles')
export class CompanyProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id' })
  companyId: string;

  @ManyToOne(() => CompetitorEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: CompetitorEntity;

  @Column({ type: 'text' })
  core_offering: string;

  @Column('text', { array: true, default: '{}' })
  unique_approaches: string[];

  @Column('text', { array: true, default: '{}' })
  key_technologies: string[];

  @Column('text', { array: true, default: '{}' })
  target_segments: string[];

  @Column('text', { array: true, default: '{}' })
  value_propositions: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 