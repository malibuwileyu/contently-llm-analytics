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
import { BusinessCategoryEntity } from './business-category.entity';
import { QueryEntity } from './query.entity';

/**
 * Entity representing a query template for generating questions
 * Templates contain placeholders that can be replaced with specific values
 */
@Entity('query_templates')
export class QueryTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  template: string;

  @Column({ length: 50 })
  @Index()
  type: string; // general, _comparison, _recommendation, _feature, _price, location

  @Column('simple-json', { nullable: true })
  placeholders: Record<string, string[]>; // Map of placeholder names to possible values

  @Column('simple-array', { nullable: true })
  requiredPlaceholders: string[]; // List of placeholders that must be filled

  @Column({ default: 1 })
  priority: number; // Higher priority templates are used more frequently

  @Column({ default: true })
  isActive: boolean;

  @Column()
  @Index()
  businessCategoryId: string;

  @ManyToOne(() => BusinessCategoryEntity, category => category.queryTemplates)
  @JoinColumn({ name: 'businessCategoryId' })
  businessCategory: BusinessCategoryEntity;

  @OneToMany(() => QueryEntity, query => query.queryTemplate)
  queries: QueryEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
