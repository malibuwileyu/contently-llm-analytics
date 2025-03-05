import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompaniesTable1709579000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."companies" (
        "id" UUID PRIMARY KEY,
        "name" VARCHAR NOT NULL,
        "settings" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."companies";
    `);
  }
}
