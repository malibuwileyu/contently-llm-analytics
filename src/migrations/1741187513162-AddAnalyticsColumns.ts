import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsColumns1741187513162 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE analytics_results
      ADD COLUMN IF NOT EXISTS visibility_score FLOAT,
      ADD COLUMN IF NOT EXISTS prominence_score FLOAT,
      ADD COLUMN IF NOT EXISTS context_score FLOAT,
      ADD COLUMN IF NOT EXISTS authority_score FLOAT,
      ADD COLUMN IF NOT EXISTS citation_frequency FLOAT,
      ADD COLUMN IF NOT EXISTS category_leadership VARCHAR(50),
      ADD COLUMN IF NOT EXISTS competitor_proximity JSONB,
      ADD COLUMN IF NOT EXISTS knowledge_base_metrics JSONB,
      ADD COLUMN IF NOT EXISTS trends JSONB,
      ADD COLUMN IF NOT EXISTS query_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS query_text TEXT,
      ADD COLUMN IF NOT EXISTS response_text TEXT,
      ADD COLUMN IF NOT EXISTS response_metadata JSONB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE analytics_results
      DROP COLUMN IF EXISTS visibility_score,
      DROP COLUMN IF EXISTS prominence_score,
      DROP COLUMN IF EXISTS context_score,
      DROP COLUMN IF EXISTS authority_score,
      DROP COLUMN IF EXISTS citation_frequency,
      DROP COLUMN IF EXISTS category_leadership,
      DROP COLUMN IF EXISTS competitor_proximity,
      DROP COLUMN IF EXISTS knowledge_base_metrics,
      DROP COLUMN IF EXISTS trends,
      DROP COLUMN IF EXISTS query_type,
      DROP COLUMN IF EXISTS query_text,
      DROP COLUMN IF EXISTS response_text,
      DROP COLUMN IF EXISTS response_metadata;
    `);
  }
} 