import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BrandMention } from './brand-mention.entity';

/**
 * Entity representing a citation in AI-generated content
 */
@Entity('citations')
export class Citation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'brand_mention_id', type: 'uuid' })
  brandMentionId: string;

  /**
   * The source of the citation
   */
  @Column({ type: 'text' })
  source: string;

  /**
   * The text of the citation
   */
  @Column({ type: 'text' })
  text: string;

  /**
   * The authority score of the citation (0 to 1)
   */
  @Column({ type: 'float', nullable: true })
  authority: number;

  /**
   * Additional metadata about the citation
   */
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    nullable: true,
  })
  deletedAt: Date;

  @ManyToOne(() => BrandMention, brandMention => brandMention.citations)
  @JoinColumn({ name: 'brand_mention_id' })
  brandMention: BrandMention;
}
