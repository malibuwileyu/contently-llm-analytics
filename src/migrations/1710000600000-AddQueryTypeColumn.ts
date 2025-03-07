import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQueryTypeColumn1710000600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add query_type column with default value 'industry'
        await queryRunner.query(`
            ALTER TABLE query_templates 
            ADD COLUMN IF NOT EXISTS query_type varchar(50) NOT NULL DEFAULT 'industry'
        `);

        // Update existing templates to have appropriate query_types
        await queryRunner.query(`
            UPDATE query_templates
            SET query_type = CASE
                WHEN template LIKE '%compared to its competitors%' OR template LIKE '%compared to its top%' THEN 'competitive'
                WHEN template LIKE '%{niche}%' OR template LIKE '%{standout_attribute}%' THEN 'context'
                ELSE 'industry'
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE query_templates 
            DROP COLUMN IF EXISTS query_type
        `);
    }
} 