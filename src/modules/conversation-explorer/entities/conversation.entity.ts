import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn, 
  OneToMany 
} from 'typeorm';
import { ConversationInsight } from './conversation-insight.entity';

/**
 * Entity representing a conversation
 */
@Entity('conversations')
export class Conversation {
  /**
   * Unique identifier for the conversation
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ID of the brand associated with this conversation
   */
  @Column('uuid')
  brandId: string;

  /**
   * Messages in the conversation
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
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  /**
   * Insights extracted from the conversation
   */
  @OneToMany(() => ConversationInsight, insight => insight.conversation)
  insights: ConversationInsight[];

  /**
   * Engagement score for the conversation (0-1)
   */
  @Column('float')
  engagementScore: number;

  /**
   * When the conversation was analyzed
   */
  @Column('timestamp')
  analyzedAt: Date;

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

  /**
   * When the conversation was deleted (for soft delete)
   */
  @DeleteDateColumn()
  deletedAt: Date;
} 