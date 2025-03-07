import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AnalyticsResult } from '../../analytics/entities/analytics-result.entity';

@Entity('customers')
export class CustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  @Column({ name: 'industry', nullable: true })
  industry: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => AnalyticsResult, result => result.customer)
  analyticsResults: AnalyticsResult[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
