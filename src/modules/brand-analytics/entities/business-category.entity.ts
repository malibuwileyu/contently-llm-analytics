/**
 * Business Category Entity
 * Represents a business category in the database
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CompetitorEntity } from './competitor.entity';
import { QueryTemplateEntity } from './query-template.entity';

/**
 * Entity representing a business category (e.g., athletic _shoes, online _shopping)
 */
@Entity('business_categories')
export class BusinessCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ length: 100, nullable: true })
  parentCategoryId: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  keywords: string[];

  @Column('simple-array', { nullable: true })
  synonyms: string[];

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => BusinessCategoryEntity, category => category.subcategories, {
    nullable: true,
  })
  @JoinColumn({ name: 'parent_category_id' })
  parentCategory: BusinessCategoryEntity;

  @OneToMany(() => BusinessCategoryEntity, category => category.parentCategory)
  subcategories: BusinessCategoryEntity[];

  @OneToMany(() => CompetitorEntity, competitor => competitor.businessCategory)
  competitors: CompetitorEntity[];

  @OneToMany(() => QueryTemplateEntity, template => template.businessCategory)
  queryTemplates: QueryTemplateEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
