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
import { Conversation } from './conversation.entity';

/**
 * Types of insights that can be extracted from a conversation
 */
export type InsightType = 'intent' | 'sentiment' | 'topic' | 'action';

/**
 * Entity representing an insight derived from a conversation
 */
@Entity('conversation_insight')
export class ConversationInsight {
  /**
   * The ID of the insight
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the conversation this insight belongs to
   */
  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  /**
   * The conversation this insight belongs to
   */
  @ManyToOne(() => Conversation, (conversation: any) => conversation._insights)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  /**
   * The type of insight
   */
  @Column({ type: 'enum', enum: ['intent', 'sentiment', 'topic', 'action'] })
  type: InsightType;

  /**
   * The category of the insight
   */
  @Column()
  category: string;

  /**
   * The confidence score for this insight (0-1)
   */
  @Column({ type: 'float' })
  confidence: number;

  /**
   * Additional details about the insight
   */
  @Column({ type: 'jsonb' })
  details: Record<string, unknown>;

  /**
   * When the insight was created
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * When the insight was last updated
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * When the insight was deleted (for soft delete)
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;
}
