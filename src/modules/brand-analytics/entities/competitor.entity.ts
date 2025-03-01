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
import { MentionEntity } from './mention.entity';

/**
 * Entity representing a competitor in a business category
 * This includes the customer's company and their competitors
 */
@Entity('competitors')
export class CompetitorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  @Index()
  name: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('simple-array', { nullable: true })
  alternateNames: string[];

  @Column('simple-array', { nullable: true })
  keywords: string[];

  @Column('simple-array', { nullable: true })
  products: string[];

  @Column({ default: false })
  isCustomer: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  @Index()
  businessCategoryId: string;

  @ManyToOne(() => BusinessCategoryEntity, category => category.competitors)
  @JoinColumn({ name: 'businessCategoryId' })
  businessCategory: BusinessCategoryEntity;

  @OneToMany(() => MentionEntity, mention => mention.competitor)
  mentions: MentionEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
