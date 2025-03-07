import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompetitorTrigger1741187513163 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a function to handle competitor changes
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION handle_competitor_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if this is a new competitor or if is_customer changed to true
        IF (TG_OP = 'INSERT' AND NEW.is_customer = true) OR
           (TG_OP = 'UPDATE' AND OLD.is_customer = false AND NEW.is_customer = true) THEN
          -- Insert a job into the analytics_jobs table
          INSERT INTO analytics_jobs (
            job_type,
            status,
            metadata,
            created_at,
            updated_at
          ) VALUES (
            'seed_competitor',
            'pending',
            jsonb_build_object(
              'competitor_id', NEW.id,
              'trigger_type', TG_OP,
              'timestamp', CURRENT_TIMESTAMP
            ),
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create the analytics_jobs table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS analytics_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        metadata JSONB,
        error_message TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_jobs_status ON analytics_jobs (status);
      CREATE INDEX IF NOT EXISTS idx_analytics_jobs_job_type ON analytics_jobs (job_type);
    `);

    // Create the trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS competitor_changes_trigger ON competitors;
      CREATE TRIGGER competitor_changes_trigger
      AFTER INSERT OR UPDATE OF is_customer
      ON competitors
      FOR EACH ROW
      EXECUTE FUNCTION handle_competitor_changes();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS competitor_changes_trigger ON competitors;
    `);

    // Drop the function
    await queryRunner.query(`
      DROP FUNCTION IF EXISTS handle_competitor_changes;
    `);

    // Drop the analytics_jobs table
    await queryRunner.query(`
      DROP TABLE IF EXISTS analytics_jobs;
    `);
  }
} 