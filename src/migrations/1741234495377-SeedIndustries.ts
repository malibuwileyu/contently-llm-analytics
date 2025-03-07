import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedIndustries1741234495377 implements MigrationInterface {
    name = 'SeedIndustries1741234495377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add unique constraint on name column
        await queryRunner.query(`
            ALTER TABLE industries 
            ADD CONSTRAINT "UQ_industries_name" 
            UNIQUE (name);
        `);

        // First, insert the Default industry with all zeros UUID
        await queryRunner.query(`
            INSERT INTO industries (id, name, description, is_active)
            VALUES ('00000000-0000-0000-0000-000000000000', 'Default', 'Default industry category', true)
            ON CONFLICT (id) DO NOTHING;
        `);

        // Then insert all other industries
        const industries = [
            'Information Technology',
            'Healthcare and Pharmaceuticals',
            'Financial Services',
            'Consumer Goods and Retail',
            'Industrial Manufacturing',
            'Energy and Utilities',
            'Telecommunications',
            'Aerospace and Defense',
            'Automotive',
            'Chemical and Materials',
            'Food and Beverage',
            'Media and Entertainment',
            'Real Estate',
            'Transportation and Logistics',
            'Hospitality and Travel',
            'Biotechnology',
            'Insurance',
            'Retail Banking',
            'Investment Banking',
            'E-commerce',
            'Software and Cloud Services',
            'Hardware and Electronics',
            'Oil and Gas',
            'Pharmaceuticals',
            'Managed Healthcare',
            'Consumer Products',
            'Restaurants and Fast Food',
            'Telecommunications Equipment',
            'Semiconductors',
            'Payment Processing'
        ];

        // Insert each industry
        for (const industry of industries) {
            await queryRunner.query(`
                INSERT INTO industries (name, description, is_active)
                VALUES ($1, $2, true)
                ON CONFLICT (name) DO NOTHING;
            `, [industry, `${industry} industry category`]);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Delete all seeded industries except the ones that are being used
        await queryRunner.query(`
            DELETE FROM industries 
            WHERE id NOT IN (
                SELECT DISTINCT industry_id 
                FROM competitors 
                WHERE industry_id IS NOT NULL
            )
            AND id != '00000000-0000-0000-0000-000000000000';
        `);

        // Drop the unique constraint
        await queryRunner.query(`
            ALTER TABLE industries 
            DROP CONSTRAINT IF EXISTS "UQ_industries_name";
        `);
    }
}
