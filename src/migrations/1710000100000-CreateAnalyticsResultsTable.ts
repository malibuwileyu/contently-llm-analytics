import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAnalyticsResultsTable1710000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing analytics_results table if it exists
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."analytics_results" CASCADE;
    `);

    // Create analytics_results table
    await queryRunner.createTable(
      new Table({
        name: 'analytics_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'company_id',
            type: 'uuid',
          },
          {
            name: 'analysis',
            type: 'jsonb',
          },
          {
            name: 'timestamp',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'metadata',
            type: 'jsonb',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add index on company_id
    await queryRunner.createIndex(
      'analytics_results',
      new TableIndex({
        name: 'idx_analytics_results_company',
        columnNames: ['company_id'],
      })
    );

    // Add foreign key for company_id referencing competitors table
    await queryRunner.createForeignKey(
      'analytics_results',
      new TableForeignKey({
        name: 'fk_analytics_results_competitor',
        columnNames: ['company_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'competitors',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."analytics_results" CASCADE;
    `);
  }
} 