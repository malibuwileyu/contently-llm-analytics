import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Citation } from './citation.entity';

/**
 * Entity representing a brand mention in AI-generated content
 */
@Entity('brand_mention')
export class BrandMention {
  /**
   * The ID of the brand mention
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the brand being mentioned
   */
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  /**
   * The content containing the brand mention
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * The sentiment score of the mention (-1 to 1)
   */
  @Column({ type: 'float', nullable: true })
  sentiment: number;

  /**
   * The magnitude of the mention
   */
  @Column({ type: 'float', nullable: true })
  magnitude: number;

  /**
   * Context information about the mention
   */
  @Column({ type: 'json', nullable: true })
  context: Record<string, unknown>;

  /**
   * When the brand was mentioned
   */
  @Column({
    name: 'mentioned_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  mentionedAt: Date;

  /**
   * When the brand mention was created
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * When the brand mention was last updated
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * When the brand mention was deleted
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;

  /**
   * Citations associated with this brand mention
   */
  @OneToMany(() => Citation, citation => citation.brandMention)
  citations: Citation[];
}
