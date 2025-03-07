import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAnalyticsResultFields1710000600001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing columns that will be modified
    await queryRunner.query(`
      ALTER TABLE analytics_results
      DROP COLUMN IF EXISTS category_leadership,
      DROP COLUMN IF EXISTS competitor_proximity,
      DROP COLUMN IF EXISTS knowledge_base_metrics,
      DROP COLUMN IF EXISTS trends,
      DROP COLUMN IF EXISTS query_variables,
      DROP COLUMN IF EXISTS context_data,
      DROP COLUMN IF EXISTS competitive_data,
      DROP COLUMN IF EXISTS response_metadata,
      DROP COLUMN IF EXISTS analysis,
      DROP COLUMN IF EXISTS metadata;
    `);

    // Add new columns
    await queryRunner.query(`
      ALTER TABLE analytics_results
      ADD COLUMN IF NOT EXISTS mention_count integer,
      ADD COLUMN IF NOT EXISTS sentiment_score float,
      ADD COLUMN IF NOT EXISTS relevance_score float,
      ADD COLUMN IF NOT EXISTS category_leadership float,
      ADD COLUMN IF NOT EXISTS competitor_proximity jsonb,
      ADD COLUMN IF NOT EXISTS knowledge_base_metrics jsonb,
      ADD COLUMN IF NOT EXISTS trends jsonb,
      ADD COLUMN IF NOT EXISTS query_variables jsonb,
      ADD COLUMN IF NOT EXISTS context_data jsonb,
      ADD COLUMN IF NOT EXISTS competitive_data jsonb,
      ADD COLUMN IF NOT EXISTS response_metadata jsonb,
      ADD COLUMN IF NOT EXISTS analysis jsonb,
      ADD COLUMN IF NOT EXISTS metadata jsonb;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`
      ALTER TABLE analytics_results
      DROP COLUMN IF EXISTS mention_count,
      DROP COLUMN IF EXISTS sentiment_score,
      DROP COLUMN IF EXISTS relevance_score,
      DROP COLUMN IF EXISTS category_leadership,
      DROP COLUMN IF EXISTS competitor_proximity,
      DROP COLUMN IF EXISTS knowledge_base_metrics,
      DROP COLUMN IF EXISTS trends,
      DROP COLUMN IF EXISTS query_variables,
      DROP COLUMN IF EXISTS context_data,
      DROP COLUMN IF EXISTS competitive_data,
      DROP COLUMN IF EXISTS response_metadata,
      DROP COLUMN IF EXISTS analysis,
      DROP COLUMN IF EXISTS metadata;
    `);

    // Add back original columns
    await queryRunner.query(`
      ALTER TABLE analytics_results
      ADD COLUMN IF NOT EXISTS category_leadership varchar(50),
      ADD COLUMN IF NOT EXISTS competitor_proximity jsonb,
      ADD COLUMN IF NOT EXISTS knowledge_base_metrics jsonb,
      ADD COLUMN IF NOT EXISTS trends jsonb,
      ADD COLUMN IF NOT EXISTS query_variables jsonb,
      ADD COLUMN IF NOT EXISTS context_data jsonb,
      ADD COLUMN IF NOT EXISTS competitive_data jsonb,
      ADD COLUMN IF NOT EXISTS response_metadata jsonb,
      ADD COLUMN IF NOT EXISTS analysis jsonb,
      ADD COLUMN IF NOT EXISTS metadata jsonb;
    `);
  }
} 