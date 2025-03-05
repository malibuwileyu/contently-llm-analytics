import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyIdToUsers1709580000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First create a default company if it doesn't exist
    await queryRunner.query(`
      INSERT INTO "public"."companies" ("id", "name", "settings")
      VALUES ('00000000-0000-0000-0000-000000000001', 'Default Company', '{}')
      ON CONFLICT DO NOTHING;
    `);

    // Then add the company_id column with default value
    await queryRunner.query(`
      ALTER TABLE "auth"."users" 
      ADD COLUMN IF NOT EXISTS "company_id" UUID DEFAULT '00000000-0000-0000-0000-000000000001',
      ADD CONSTRAINT "fk_user_company" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "auth"."users" 
      DROP CONSTRAINT IF EXISTS "fk_user_company",
      DROP COLUMN IF EXISTS "company_id";

      DELETE FROM "public"."companies" WHERE "id" = '00000000-0000-0000-0000-000000000001';
    `);
  }
}
