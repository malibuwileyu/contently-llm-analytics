import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAnalyticsResultsSchema1710000200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing analytics_results table
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."analytics_results" CASCADE;
    `);

    // Create analytics_results table with updated schema
    await queryRunner.query(`
      CREATE TABLE "public"."analytics_results" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "company_id" uuid NOT NULL,
        "analysis" jsonb NOT NULL,
        "timestamp" timestamp NOT NULL DEFAULT now(),
        "metadata" jsonb NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analytics_results" PRIMARY KEY ("id"),
        CONSTRAINT "FK_analytics_results_competitor" FOREIGN KEY ("company_id") 
          REFERENCES "public"."competitors"("id") ON DELETE CASCADE
      );

      CREATE INDEX "idx_analytics_results_company" ON "public"."analytics_results" ("company_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."analytics_results" CASCADE;
    `);
  }
} 