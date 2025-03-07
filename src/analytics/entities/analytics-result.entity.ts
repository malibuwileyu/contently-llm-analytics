import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';

@Entity('analytics_results')
export class AnalyticsResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @ManyToOne(() => CompetitorEntity)
  @JoinColumn({ name: 'company_id' })
  competitor: CompetitorEntity;

  @Column({ type: 'text', name: 'query_text' })
  queryText: string;

  @Column({ type: 'text', name: 'response_text' })
  responseText: string;

  @Column({ type: 'float', name: 'visibility_score' })
  visibilityScore: number;

  @Column({ type: 'float', name: 'prominence_score' })
  prominenceScore: number;

  @Column({ type: 'float', name: 'context_score' })
  contextScore: number;

  @Column({ type: 'float', name: 'authority_score' })
  authorityScore: number;

  @Column({ type: 'float', name: 'citation_frequency' })
  citationFrequency: number;

  @Column({ type: 'text', name: 'category_leadership' })
  categoryLeadership: string;

  @Column({ type: 'jsonb', name: 'competitor_proximity' })
  competitorProximity: Array<{
    competitor: string;
    distance: number;
    relationship: string;
  }>;

  @Column({ type: 'jsonb', name: 'knowledge_base_metrics' })
  knowledgeBaseMetrics: {
    knowledgeBaseStrength: number;
    contextualAuthority: number;
    topicalLeadership: string[];
  };

  @Column({ type: 'jsonb', name: 'trends' })
  trends: {
    visibilityTrend: string;
    rankingStability: number;
    competitorDynamics: string;
  };

  @Column({ type: 'jsonb', name: 'response_metadata' })
  responseMetadata: Record<string, any>;

  @Column({ type: 'text', name: 'query_type' })
  queryType: string;

  @Column({ type: 'timestamp', name: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'jsonb', name: 'analysis' })
  analysis: {
    question: string;
    aiResponse: {
      content: string;
      metadata: Record<string, any>;
    };
    brandHealth: {
      visibilityMetrics: {
        overallVisibility: number;
        categoryRankings: Record<string, number>;
        competitorComparison: Record<string, {
          visibility: number;
          relativeDelta: number;
        }>;
      };
      llmPresence: {
        knowledgeBaseStrength: number;
        contextualAuthority: number;
        topicalLeadership: string[];
      };
      trendsOverTime: {
        visibilityTrend: string;
        rankingStability: number;
        competitorDynamics: string;
      };
    };
    brandMentions: Array<{
      visibility: {
        prominence: number;
        contextScore: number;
        competitorProximity: Array<{
          competitor: string;
          distance: number;
          relationship: string;
        }>;
      };
      knowledgeBaseMetrics: {
        citationFrequency: number;
        authorityScore: number;
        categoryLeadership: string;
      };
    }>;
    metrics: {
      visibilityStats: {
        prominenceScore: number;
      };
    };
  };

  @Column({ type: 'jsonb', name: 'metadata' })
  metadata: {
    version: string;
    batchId: string;
    queryType: string;
    index: number;
  };

  @Column({ type: 'integer', name: 'mention_count' })
  mentionCount: number;

  @Column({ type: 'float', name: 'sentiment_score' })
  sentimentScore: number;

  @Column({ type: 'float', name: 'relevance_score' })
  relevanceScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 