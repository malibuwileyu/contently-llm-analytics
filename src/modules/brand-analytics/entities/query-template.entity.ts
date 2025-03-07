import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import type { IndustryEntity } from './industry.entity';

/**
 * Entity representing a query template for brand analytics
 */
@Entity('query_templates')
export class QueryTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'businessCategoryId' })
  businessCategoryId: string;

  @Column('text')
  template: string;

  @Column({ length: 50 })
  type: string;

  @Column({ length: 50, default: 'industry' })
  query_type: string;

  @Column('text', { array: true, nullable: true })
  placeholders: string[];

  @Column('text', { array: true, nullable: true })
  requiredPlaceholders: string[];

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ name: 'isActive', default: true })
  isActive: boolean;

  @ManyToOne('IndustryEntity')
  @JoinColumn({ name: 'businessCategoryId' })
  industry: IndustryEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 