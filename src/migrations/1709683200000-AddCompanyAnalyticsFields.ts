import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyAnalyticsFields1709683200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Update existing companies to include new settings fields
    await queryRunner.query(`
      UPDATE companies
      SET settings = settings || 
        jsonb_build_object(
          'industry', NULL,
          'competitors', '[]'::jsonb,
          'regions', '[]'::jsonb
        )
      WHERE settings IS NOT NULL;
    `);

    // For companies without settings, initialize with empty object
    await queryRunner.query(`
      UPDATE companies
      SET settings = jsonb_build_object(
        'industry', NULL,
        'competitors', '[]'::jsonb,
        'regions', '[]'::jsonb
      )
      WHERE settings IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new fields from settings
    await queryRunner.query(`
      UPDATE companies
      SET settings = settings - 'industry' - 'competitors' - 'regions'
      WHERE settings IS NOT NULL;
    `);
  }
} 