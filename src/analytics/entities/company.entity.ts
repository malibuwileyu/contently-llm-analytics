import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'public', name: 'companies' })
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowedDomains?: string[];
    features?: string[];
    successCriteria?: {
      minConfidenceScore?: number;
      minResponseQuality?: number;
      maxDuration?: number;
    };
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
