import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBrandVisibilityAnalytics1710000400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create company_profiles table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "company_profiles" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL REFERENCES "competitors" ("id") ON DELETE CASCADE,
        "core_offering" text NOT NULL,
        "unique_approaches" text[] NOT NULL DEFAULT '{}',
        "key_technologies" text[] NOT NULL DEFAULT '{}',
        "target_segments" text[] NOT NULL DEFAULT '{}',
        "value_propositions" text[] NOT NULL DEFAULT '{}',
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        UNIQUE ("company_id")
      );
    `);

    // Create index for company_profiles
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_company_profiles_company ON company_profiles (company_id);`);

    // Add new columns to analytics_results
    await queryRunner.query(`
      ALTER TABLE "analytics_results"
      ADD COLUMN IF NOT EXISTS "query_type" varchar(20) NOT NULL DEFAULT 'industry',
      ADD COLUMN IF NOT EXISTS "query_intent" varchar(50),
      ADD COLUMN IF NOT EXISTS "query_variables" jsonb,
      ADD COLUMN IF NOT EXISTS "context_data" jsonb,
      ADD COLUMN IF NOT EXISTS "competitive_data" jsonb,
      ADD COLUMN IF NOT EXISTS "mention_count" integer,
      ADD COLUMN IF NOT EXISTS "prominence_score" float,
      ADD COLUMN IF NOT EXISTS "sentiment_score" float,
      ADD COLUMN IF NOT EXISTS "relevance_score" float,
      ADD COLUMN IF NOT EXISTS "context_score" float;
    `);

    // Create indexes for analytics_results
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_analytics_results_query_type ON analytics_results (query_type);`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_analytics_results_query_intent ON analytics_results (query_intent);`);

    // Create view for aggregated visibility metrics
    await queryRunner.query(`
      CREATE OR REPLACE VIEW visibility_metrics_view AS
      SELECT 
        ar.company_id,
        ar.query_type,
        COUNT(*) as total_queries,
        AVG(ar.mention_count) as avg_mentions,
        AVG(ar.prominence_score) as avg_prominence,
        AVG(ar.sentiment_score) as avg_sentiment,
        AVG(ar.relevance_score) as avg_relevance,
        AVG(ar.context_score) as avg_context
      FROM analytics_results ar
      GROUP BY ar.company_id, ar.query_type;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop view first
    await queryRunner.query(`DROP VIEW IF EXISTS visibility_metrics_view;`);
    
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS idx_analytics_results_query_type;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_analytics_results_query_intent;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_company_profiles_company;`);
    
    // Drop columns from analytics_results
    await queryRunner.query(`
      ALTER TABLE "analytics_results"
      DROP COLUMN IF EXISTS "query_type",
      DROP COLUMN IF EXISTS "query_intent",
      DROP COLUMN IF EXISTS "query_variables",
      DROP COLUMN IF EXISTS "context_data",
      DROP COLUMN IF EXISTS "competitive_data",
      DROP COLUMN IF EXISTS "mention_count",
      DROP COLUMN IF EXISTS "prominence_score",
      DROP COLUMN IF EXISTS "sentiment_score",
      DROP COLUMN IF EXISTS "relevance_score",
      DROP COLUMN IF EXISTS "context_score";
    `);
    
    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "company_profiles";`);
  }
} 