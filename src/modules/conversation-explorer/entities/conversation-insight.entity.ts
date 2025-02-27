import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Conversation } from './conversation.entity';

/**
 * Entity representing an insight extracted from a conversation
 */
@Entity('conversation_insights')
export class ConversationInsight {
  /**
   * Unique identifier for the insight
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the conversation this insight belongs to
   */
  @Column('uuid')
  conversationId: string;

  /**
   * Type of insight (intent, sentiment, topic, action)
   */
  @Column('varchar')
  type: string;

  /**
   * Category of the insight
   */
  @Column('varchar')
  category: string;

  /**
   * Confidence score for the insight (0-1)
   */
  @Column('float')
  confidence: number;

  /**
   * Additional details about the insight
   */
  @Column('jsonb')
  details: Record<string, any>;

  /**
   * The conversation this insight belongs to
   */
  @ManyToOne(() => Conversation, conversation => conversation.insights)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  /**
   * When the insight was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When the insight was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;
} 