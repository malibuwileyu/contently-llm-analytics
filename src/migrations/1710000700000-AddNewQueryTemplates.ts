import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { join } from 'path';

export class AddNewQueryTemplates1710000700000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, delete all existing queries that reference query_templates
        await queryRunner.query(`DELETE FROM queries WHERE "queryTemplateId" IS NOT NULL`);
        
        // Then delete all existing query templates
        await queryRunner.query(`DELETE FROM query_templates`);

        // Now read and execute the SQL file with new templates
        const sqlPath = join(__dirname, '..', 'scripts', 'new-templates.sql');
        const sql = readFileSync(sqlPath, 'utf8');
        await queryRunner.query(sql);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // In down migration, we'll delete all queries first
        await queryRunner.query(`DELETE FROM queries WHERE "queryTemplateId" IS NOT NULL`);
        // Then delete all templates
        await queryRunner.query(`DELETE FROM query_templates`);
    }
} 