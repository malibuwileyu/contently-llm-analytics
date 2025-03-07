import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompetitorColumns1710000300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns to competitors table
    await queryRunner.query(`
      ALTER TABLE competitors
      ADD COLUMN IF NOT EXISTS "alternateNames" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "products" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "regions" text[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS "competitors" text[] DEFAULT '{}'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove columns from competitors table
    await queryRunner.query(`
      ALTER TABLE competitors
      DROP COLUMN IF EXISTS "alternateNames",
      DROP COLUMN IF EXISTS "products",
      DROP COLUMN IF EXISTS "regions",
      DROP COLUMN IF EXISTS "competitors"
    `);
  }
} 