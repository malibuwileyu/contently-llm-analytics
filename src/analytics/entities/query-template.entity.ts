import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { QueryType, QueryIntent } from '../types/query.types';

@Entity('query_templates')
export class QueryTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: QueryType,
    nullable: false
  })
  type: QueryType;

  @Column({
    type: 'enum',
    enum: QueryIntent,
    nullable: true // Temporarily set to true to allow schema sync
  })
  intent: QueryIntent;

  @Column('text')
  template: string;

  @Column('simple-array')
  variables: string[];

  @Column('jsonb')
  validationRules: any[];

  @Column('jsonb')
  responseValidation: any;

  @Column('int')
  priority: number;

  @Column('boolean', { default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  businessCategoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

module.exports = { QueryTemplateEntity }; 