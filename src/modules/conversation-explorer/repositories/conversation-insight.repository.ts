import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { ConversationInsight, InsightType } from '../entities/conversation-insight.entity';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * Repository for conversation insights
 */
@Injectable()
export class ConversationInsightRepository {
  private repository: Repository<ConversationInsight>;

  constructor(
    @InjectRepository(ConversationInsight)
    repository: Repository<ConversationInsight>,
    private dataSource: DataSource
  ) {
    this.repository = repository;
  }

  /**
   * Create a new conversation insight
   */
  create(data: Partial<ConversationInsight>): ConversationInsight {
    return this.repository.create(data);
  }

  /**
   * Save a conversation insight
   */
  async save(insight: ConversationInsight): Promise<ConversationInsight> {
    return this.repository.save(insight);
  }

  /**
   * Find insights by conversation ID
   */
  async findByConversationId(conversationId: string): Promise<ConversationInsight[]> {
    return this.repository.find({
      where: { conversation: { id: conversationId } },
      relations: ['conversation']
    });
  }

  /**
   * Find insights by brand ID
   */
  async findByBrandId(brandId: string): Promise<ConversationInsight[]> {
    return this.repository.find({
      where: { conversation: { brandId } },
      relations: ['conversation']
    });
  }

  /**
   * Find insights by type
   */
  async findByType(type: InsightType): Promise<ConversationInsight[]> {
    return this.repository.find({
      where: { type },
      relations: ['conversation']
    });
  }

  /**
   * Delete insights by conversation ID
   */
  async deleteByConversationId(conversationId: string): Promise<void> {
    await this.repository.delete({ conversation: { id: conversationId } });
  }
} 