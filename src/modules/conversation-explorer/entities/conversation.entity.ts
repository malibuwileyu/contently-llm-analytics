import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ConversationInsight } from './conversation-insight.entity';

/**
 * Entity representing a conversation between a user and an AI assistant
 */
@Entity('conversations')
export class Conversation {
  /**
   * The ID of the conversation
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * The ID of the brand associated with this conversation
   */
  @Column('uuid')
  brandId: string;

  /**
   * The messages in the conversation
   */
  @Column('jsonb')
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;

  /**
   * Metadata about the conversation
   */
  @Column('jsonb')
  _metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  /**
   * Insights derived from this conversation
   */
  @OneToMany(() => ConversationInsight, insight => insight.conversation)
  _insights: ConversationInsight[];

  /**
   * Engagement score for the conversation (0-1)
   */
  @Column('float')
  _engagementScore: number;

  /**
   * When the conversation was analyzed
   */
  @Column('timestamp with time zone')
  _analyzedAt: Date;

  /**
   * When the conversation was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When the conversation was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
}
