import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

/**
 * Migration to create Answer Engine tables
 * - brand_mention: Stores mentions of brands in content
 * - citation: Stores citations associated with brand mentions
 */
export class CreateAnswerEngineTables1709078400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure the uuid-ossp extension is available for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create the brand_mention table
    await queryRunner.createTable(
      new Table({
        name: 'brand_mention',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'brand_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'sentiment',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'magnitude',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'context',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mentioned_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create the citation table
    await queryRunner.createTable(
      new Table({
        name: 'citation',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'brand_mention_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'source',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'authority',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp with time zone',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add foreign key for citation to brand_mention
    await queryRunner.createForeignKey(
      'citation',
      new TableForeignKey({
        columnNames: ['brand_mention_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'brand_mention',
        onDelete: 'CASCADE',
      })
    );

    // Create indexes for brand_mention table
    await queryRunner.createIndices('brand_mention', [
      new TableIndex({
        name: 'IDX_brand_mention_brand_id',
        columnNames: ['brand_id'],
      }),
      new TableIndex({
        name: 'IDX_brand_mention_mentioned_at',
        columnNames: ['mentioned_at'],
      }),
      new TableIndex({
        name: 'IDX_brand_mention_sentiment',
        columnNames: ['sentiment'],
      }),
    ]);

    // Create indexes for citation table
    await queryRunner.createIndices('citation', [
      new TableIndex({
        name: 'IDX_citation_brand_mention_id',
        columnNames: ['brand_mention_id'],
      }),
      new TableIndex({
        name: 'IDX_citation_authority',
        columnNames: ['authority'],
      }),
      new TableIndex({
        name: 'IDX_citation_source',
        columnNames: ['source'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('citation', 'IDX_citation_source');
    await queryRunner.dropIndex('citation', 'IDX_citation_authority');
    await queryRunner.dropIndex('citation', 'IDX_citation_brand_mention_id');
    
    await queryRunner.dropIndex('brand_mention', 'IDX_brand_mention_sentiment');
    await queryRunner.dropIndex('brand_mention', 'IDX_brand_mention_mentioned_at');
    await queryRunner.dropIndex('brand_mention', 'IDX_brand_mention_brand_id');

    // Drop foreign key
    const citationTable = await queryRunner.getTable('citation');
    if (citationTable) {
      const foreignKey = citationTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('brand_mention_id') !== -1
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('citation', foreignKey);
      }
    }

    // Drop tables
    await queryRunner.dropTable('citation');
    await queryRunner.dropTable('brand_mention');
  }
} 