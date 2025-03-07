import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import type { CompetitorEntity } from './competitor.entity';

/**
 * Entity representing an industry (e.g., Computer Hardware, Athletic Shoes)
 */
@Entity('industries')
export class IndustryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany('CompetitorEntity', (competitor: CompetitorEntity) => competitor.industry)
  competitors: CompetitorEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 