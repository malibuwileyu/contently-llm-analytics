import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class ReplaceBusinessCategoryWithIndustry1741233234411 implements MigrationInterface {
    name = 'ReplaceBusinessCategoryWithIndustry1741233234411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create industries table
        await queryRunner.createTable(new Table({
            name: 'industries',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '100',
                    isNullable: false,
                },
                {
                    name: 'parent_industry_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'keywords',
                    type: 'text',
                    isArray: true,
                    isNullable: true,
                },
                {
                    name: 'synonyms',
                    type: 'text',
                    isArray: true,
                    isNullable: true,
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    default: true,
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
        }), true);

        // 2. Add self-referencing foreign key for parent industry
        await queryRunner.createForeignKey('industries', new TableForeignKey({
            columnNames: ['parent_industry_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'industries',
            onDelete: 'SET NULL',
        }));

        // 3. Migrate data from business_categories to industries
        await queryRunner.query(`
            INSERT INTO industries (
                id,
                name,
                parent_industry_id,
                description,
                keywords,
                synonyms,
                is_active,
                created_at,
                updated_at
            )
            SELECT
                id,
                name,
                parent_category_id,
                description,
                keywords,
                synonyms,
                is_active,
                created_at,
                updated_at
            FROM business_categories;
        `);

        // 4. Add industry_id column to competitors
        await queryRunner.addColumn('competitors', new TableColumn({
            name: 'industry_id',
            type: 'uuid',
            isNullable: true,
        }));

        // 5. Add foreign key for industry_id
        await queryRunner.createForeignKey('competitors', new TableForeignKey({
            columnNames: ['industry_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'industries',
            onDelete: 'SET NULL',
        }));

        // 6. Migrate business_category_id data to industry_id
        await queryRunner.query(`
            UPDATE competitors
            SET industry_id = business_category_id
            WHERE business_category_id IS NOT NULL;
        `);

        // 7. Add settings column if it doesn't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'competitors'
                    AND column_name = 'settings'
                ) THEN
                    ALTER TABLE competitors ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
                END IF;
            END
            $$;
        `);

        // 8. Update settings JSONB to remove industry field
        await queryRunner.query(`
            UPDATE competitors
            SET settings = COALESCE(settings, '{}'::jsonb) - 'industry';
        `);

        // 9. Drop the existing company view and its metadata
        await queryRunner.query(`DELETE FROM "public"."typeorm_metadata" WHERE "type" = 'VIEW' AND "name" = 'company' AND "schema" = 'public'`);
        await queryRunner.query(`DROP VIEW IF EXISTS "company"`);

        // 10. Create the new company view using industries table
        await queryRunner.query(`CREATE VIEW "company" AS SELECT "c"."id" AS "id", "c"."name" AS "name", "c"."website" AS "domain", "c"."is_customer" AS "isCustomer", jsonb_build_object(
            'industry', "i"."name",
            'competitors', COALESCE(
                (
                    SELECT jsonb_agg(comp.id)
                    FROM competitors comp
                    WHERE comp.industry_id = c.industry_id
                    AND comp.id != c.id
                ),
                '[]'::jsonb
            ),
            'regions', '[]'::jsonb
        ) AS "settings", "c"."created_at" AS "createdAt", "c"."updated_at" AS "updatedAt" FROM "public"."competitors" "c" LEFT JOIN "public"."industries" "i" ON "i"."id" = "c"."industry_id" WHERE "c"."is_customer" = true`);

        // 11. Add the view metadata
        await queryRunner.query(`INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, 'public', DEFAULT, 'VIEW', 'company', 'SELECT "c"."id" AS "id", "c"."name" AS "name", "c"."website" AS "domain", "c"."is_customer" AS "isCustomer", jsonb_build_object(
            ''industry'', "i"."name",
            ''competitors'', COALESCE(
                (
                    SELECT jsonb_agg(comp.id)
                    FROM competitors comp
                    WHERE comp.industry_id = c.industry_id
                    AND comp.id != c.id
                ),
                ''[]''::jsonb
            ),
            ''regions'', ''[]''::jsonb
        ) AS "settings", "c"."created_at" AS "createdAt", "c"."updated_at" AS "updatedAt" FROM "public"."competitors" "c" LEFT JOIN "public"."industries" "i" ON "i"."id" = "c"."industry_id" WHERE "c"."is_customer" = true')`);

        // 12. Drop the business_category_id column and its foreign key
        await queryRunner.query(`ALTER TABLE "competitors" DROP CONSTRAINT "FK_e07283dc494d5aa322ec59a9989"`);
        await queryRunner.query(`ALTER TABLE "competitors" DROP COLUMN "business_category_id"`);

        // 13. Drop the business_categories table and its foreign key
        await queryRunner.query(`ALTER TABLE "business_categories" DROP CONSTRAINT "FK_8e0a7e3c34fa7f428c99f085ac8"`);
        await queryRunner.dropTable('business_categories');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Recreate business_categories table
        await queryRunner.createTable(new Table({
            name: 'business_categories',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    generationStrategy: 'uuid',
                    default: 'uuid_generate_v4()',
                },
                {
                    name: 'name',
                    type: 'varchar',
                    length: '100',
                    isNullable: false,
                },
                {
                    name: 'parent_category_id',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'keywords',
                    type: 'text',
                    isArray: true,
                    isNullable: true,
                },
                {
                    name: 'synonyms',
                    type: 'text',
                    isArray: true,
                    isNullable: true,
                },
                {
                    name: 'is_active',
                    type: 'boolean',
                    default: true,
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
        }), true);

        // 2. Add foreign key for self-referencing parent category
        await queryRunner.createForeignKey('business_categories', new TableForeignKey({
            columnNames: ['parent_category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'business_categories',
            onDelete: 'SET NULL',
        }));

        // 3. Migrate data back from industries to business_categories
        await queryRunner.query(`
            INSERT INTO business_categories (
                id,
                name,
                parent_category_id,
                description,
                keywords,
                synonyms,
                is_active,
                created_at,
                updated_at
            )
            SELECT
                id,
                name,
                parent_industry_id,
                description,
                keywords,
                synonyms,
                is_active,
                created_at,
                updated_at
            FROM industries;
        `);

        // 4. Drop the new company view and its metadata
        await queryRunner.query(`DELETE FROM "public"."typeorm_metadata" WHERE "type" = 'VIEW' AND "name" = 'company' AND "schema" = 'public'`);
        await queryRunner.query(`DROP VIEW IF EXISTS "company"`);

        // 5. Recreate the old company view
        await queryRunner.query(`CREATE VIEW "company" AS SELECT "c"."id" AS "id", "c"."name" AS "name", "c"."website" AS "domain", "c"."is_customer" AS "isCustomer", jsonb_build_object(
            'industry', "bc"."name",
            'competitors', COALESCE(
                (
                    SELECT jsonb_agg(comp.id)
                    FROM competitors comp
                    WHERE comp.business_category_id = c.business_category_id
                    AND comp.id != c.id
                ),
                '[]'::jsonb
            ),
            'regions', '[]'::jsonb
        ) AS "settings", "c"."created_at" AS "createdAt", "c"."updated_at" AS "updatedAt" FROM "public"."competitors" "c" LEFT JOIN "public"."business_categories" "bc" ON "bc"."id" = "c"."business_category_id" WHERE "c"."is_customer" = true`);

        // 6. Add the old view metadata
        await queryRunner.query(`INSERT INTO "public"."typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES (DEFAULT, 'public', DEFAULT, 'VIEW', 'company', 'SELECT "c"."id" AS "id", "c"."name" AS "name", "c"."website" AS "domain", "c"."is_customer" AS "isCustomer", jsonb_build_object(
            ''industry'', "bc"."name",
            ''competitors'', COALESCE(
                (
                    SELECT jsonb_agg(comp.id)
                    FROM competitors comp
                    WHERE comp.business_category_id = c.business_category_id
                    AND comp.id != c.id
                ),
                ''[]''::jsonb
            ),
            ''regions'', ''[]''::jsonb
        ) AS "settings", "c"."created_at" AS "createdAt", "c"."updated_at" AS "updatedAt" FROM "public"."competitors" "c" LEFT JOIN "public"."business_categories" "bc" ON "bc"."id" = "c"."business_category_id" WHERE "c"."is_customer" = true')`);

        // 7. Add back the business_category_id column
        await queryRunner.addColumn('competitors', new TableColumn({
            name: 'business_category_id',
            type: 'uuid',
            isNullable: true,
        }));

        // 8. Create foreign key for business_category_id
        await queryRunner.createForeignKey('competitors', new TableForeignKey({
            columnNames: ['business_category_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'business_categories',
            onDelete: 'SET NULL',
        }));

        // 9. Migrate industry_id data back to business_category_id
        await queryRunner.query(`
            UPDATE competitors
            SET business_category_id = industry_id
            WHERE industry_id IS NOT NULL;
        `);

        // 10. Update settings JSONB to add back industry field
        await queryRunner.query(`
            UPDATE competitors c
            SET settings = jsonb_set(
                COALESCE(settings, '{}'::jsonb),
                '{industry}',
                (SELECT to_jsonb(name) FROM industries WHERE id = c.industry_id),
                true
            )
            WHERE industry_id IS NOT NULL;
        `);

        // 11. Drop the industry_id column and its foreign key
        const table = await queryRunner.getTable('competitors');
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf('industry_id') !== -1);
        if (foreignKey) {
            await queryRunner.dropForeignKey('competitors', foreignKey);
        }
        await queryRunner.dropColumn('competitors', 'industry_id');

        // 12. Drop the industries table and its foreign key
        await queryRunner.query(`ALTER TABLE "industries" DROP CONSTRAINT "FK_faad82d69ac48bff588945685d1"`);
        await queryRunner.dropTable('industries');
    }
}
