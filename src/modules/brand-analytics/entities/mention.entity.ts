import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CompetitorEntity } from './competitor.entity';
import { ResponseEntity } from './response.entity';

/**
 * Entity representing a brand mention detected in an AI response
 */
@Entity('mentions')
export class MentionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string; // The exact text of the mention

  @Column('text')
  context: string; // The surrounding text for context

  @Column({ type: 'int' })
  startPosition: number; // Start position in the response text

  @Column({ type: 'int' })
  endPosition: number; // End position in the response text

  @Column({ type: 'float', nullable: true })
  confidence: number; // Confidence score of the mention detection (0-1)

  @Column({ type: 'float', nullable: true })
  sentimentScore: number; // Sentiment score (-1 to 1)

  @Column({ length: 50, nullable: true })
  sentimentLabel: string; // positive, negative, neutral

  @Column('simple-array', { nullable: true })
  associatedFeatures: string[]; // Features mentioned alongside the brand

  @Column('simple-array', { nullable: true })
  associatedProducts: string[]; // Products mentioned alongside the brand

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>; // Additional metadata about the mention

  @Column()
  @Index()
  competitorId: string;

  @ManyToOne(() => CompetitorEntity, competitor => competitor.mentions)
  @JoinColumn({ name: 'competitorId' })
  competitor: CompetitorEntity;

  @Column()
  @Index()
  responseId: string;

  @ManyToOne(() => ResponseEntity, response => response.mentions)
  @JoinColumn({ name: 'responseId' })
  response: ResponseEntity;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
