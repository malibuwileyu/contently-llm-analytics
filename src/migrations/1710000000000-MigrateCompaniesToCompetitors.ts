import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class MigrateCompaniesToCompetitors1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing business_categories table if it exists
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."business_categories" CASCADE;
    `);

    // Create business_categories table
    await queryRunner.createTable(
      new Table({
        name: 'business_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
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
            isNullable: true,
          },
          {
            name: 'synonyms',
            type: 'text',
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
      }),
      true
    );

    // Add index on name
    await queryRunner.createIndex(
      'business_categories',
      new TableIndex({
        name: 'idx_business_categories_name',
        columnNames: ['name'],
      })
    );

    // Add self-referential foreign key for parent_category_id
    await queryRunner.createForeignKey(
      'business_categories',
      new TableForeignKey({
        name: 'fk_business_category_parent',
        columnNames: ['parent_category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'business_categories',
        onDelete: 'SET NULL',
      })
    );

    // Insert default business category
    await queryRunner.query(`
      INSERT INTO business_categories (id, name, description)
      VALUES ('00000000-0000-0000-0000-000000000001', 'General', 'General business category')
    `);

    // Drop existing competitors table if it exists
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."competitors" CASCADE;
    `);

    // Create competitors table
    await queryRunner.createTable(
      new Table({
        name: 'competitors',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'website',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'alternate_names',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'keywords',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'products',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'business_category_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'is_customer',
            type: 'boolean',
            default: false,
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
      }),
      true
    );

    // Add indexes
    await queryRunner.createIndex(
      'competitors',
      new TableIndex({
        name: 'idx_competitors_name',
        columnNames: ['name'],
      })
    );

    await queryRunner.createIndex(
      'competitors',
      new TableIndex({
        name: 'idx_competitors_business_category',
        columnNames: ['business_category_id'],
      })
    );

    // Add foreign key for business_category_id
    await queryRunner.createForeignKey(
      'competitors',
      new TableForeignKey({
        name: 'fk_competitor_business_category',
        columnNames: ['business_category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'business_categories',
        onDelete: 'SET NULL',
      })
    );

    // Check if companies table exists and migrate data if it does
    const companiesTableExists = await queryRunner.hasTable('companies');
    if (companiesTableExists) {
      // Move data from companies to competitors
      await queryRunner.query(`
        INSERT INTO competitors (id, name, description, business_category_id, is_customer, is_active, created_at, updated_at)
        SELECT id, name, '', '00000000-0000-0000-0000-000000000001', true, true, created_at, updated_at
        FROM companies
      `);

      // Update user references to point to competitors table
      await queryRunner.query(`
        ALTER TABLE "auth"."users"
        DROP CONSTRAINT IF EXISTS "fk_user_company";
      `);

      await queryRunner.query(`
        ALTER TABLE "auth"."users"
        ALTER COLUMN "company_id" DROP DEFAULT,
        ADD CONSTRAINT "fk_user_competitor" 
        FOREIGN KEY ("company_id") 
        REFERENCES "public"."competitors"("id") 
        ON DELETE SET NULL;
      `);

      // Drop companies table
      await queryRunner.query(`
        DROP TABLE IF EXISTS "public"."companies" CASCADE;
      `);
    } else {
      // If companies table doesn't exist, just update the users table foreign key
      await queryRunner.query(`
        ALTER TABLE "auth"."users"
        DROP CONSTRAINT IF EXISTS "fk_user_company";
      `);

      await queryRunner.query(`
        ALTER TABLE "auth"."users"
        ALTER COLUMN "company_id" DROP DEFAULT,
        ADD CONSTRAINT "fk_user_competitor" 
        FOREIGN KEY ("company_id") 
        REFERENCES "public"."competitors"("id") 
        ON DELETE SET NULL;
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop competitors table and its dependencies
    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."competitors" CASCADE;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "public"."business_categories" CASCADE;
    `);

    // Recreate companies table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "public"."companies" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR NOT NULL,
        "settings" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Update user references back to companies table
    await queryRunner.query(`
      ALTER TABLE "auth"."users"
      DROP CONSTRAINT IF EXISTS "fk_user_competitor";
    `);

    await queryRunner.query(`
      ALTER TABLE "auth"."users"
      ALTER COLUMN "company_id" DROP DEFAULT,
      ADD CONSTRAINT "fk_user_company" 
      FOREIGN KEY ("company_id") 
      REFERENCES "public"."companies"("id") 
      ON DELETE SET NULL;
    `);
  }
} 