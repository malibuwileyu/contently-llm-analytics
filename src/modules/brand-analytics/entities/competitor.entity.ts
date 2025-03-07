import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { IndustryEntity } from './industry.entity';

/**
 * Entity representing a competitor in a specific industry
 */
@Entity('competitors')
export class CompetitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  keywords: string[];

  @Column({ name: 'is_customer', default: false })
  isCustomer: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'industry_id' })
  industryId: string;

  @Column({ type: process.env.NODE_ENV === 'test' ? 'text' : 'jsonb', nullable: true, default: '{}', transformer: {
    to: (value: Record<string, any>) => {
      if (typeof value === 'string') {
        try {
          return JSON.stringify(JSON.parse(value));
        } catch {
          return value;
        }
      }
      return JSON.stringify(value);
    },
    from: (value: string | object) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return {};
        }
      }
      return value;
    }
  }})
  settings: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne('IndustryEntity')
  @JoinColumn({ name: 'industry_id' })
  industry: IndustryEntity;

  @Column('text', { array: true, nullable: true, default: '[]' })
  alternateNames: string[];

  @Column('text', { array: true, nullable: true, default: '[]' })
  products: string[];

  @Column('text', { array: true, nullable: true, default: '[]' })
  regions: string[];

  @Column('text', { array: true, nullable: true, default: '[]' })
  competitors: string[];
} 