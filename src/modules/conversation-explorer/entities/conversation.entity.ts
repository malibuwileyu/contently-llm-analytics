import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ConversationInsight } from './conversation-insight.entity';

/**
 * Entity representing a conversation between a user and an AI assistant
 */
@Entity('conversation')
export class Conversation {
  /**
   * The ID of the conversation
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the brand associated with this conversation
   */
  @Column({ name: 'brand_id', type: 'uuid' })
  brandId: string;

  /**
   * The messages in the conversation
   */
  @Column({ type: 'jsonb' })
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];

  /**
   * Metadata about the conversation
   */
  @Column({ type: 'jsonb' })
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  /**
   * Insights derived from this conversation
   */
  @OneToMany(() => ConversationInsight, insight => insight.conversation)
  insights: ConversationInsight[];

  /**
   * Engagement score for the conversation (0-1)
   */
  @Column({ name: 'engagement_score', type: 'float' })
  engagementScore: number;

  /**
   * When the conversation was analyzed
   */
  @Column({ name: 'analyzed_at', type: 'timestamp with time zone' })
  analyzedAt: Date;

  /**
   * When the conversation was created
   */
  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  /**
   * When the conversation was last updated
   */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  /**
   * When the conversation was deleted (for soft delete)
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
    nullable: true,
  })
  deletedAt: Date;
}
