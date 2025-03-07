import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import type { QueryType, QueryIntent, ValidationRule, ResponseValidation } from '../types/query.types';

@Entity('query_templates')
class QueryTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['industry', 'context', 'competitive'],
    nullable: false
  })
  type: QueryType;

  @Column({
    type: 'enum',
    enum: [
      'discovery',
      'presence',
      'authority',
      'differentiation',
      'impact',
      'sentiment',
      'competitive_position',
      'market_share',
      'technology',
      'implementation'
    ],
    nullable: false
  })
  intent: QueryIntent;

  @Column('text')
  template: string;

  @Column('simple-array')
  variables: string[];

  @Column('jsonb')
  validationRules: ValidationRule[];

  @Column('jsonb')
  responseValidation: ResponseValidation;

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

module.exports = QueryTemplateEntity;
exports.QueryTemplateEntity = QueryTemplateEntity; 