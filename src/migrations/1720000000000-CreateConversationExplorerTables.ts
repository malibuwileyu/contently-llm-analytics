import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migration to create Conversation Explorer tables
 */
export class CreateConversationExplorerTables1720000000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create conversations table
    await queryRunner.createTable(
      new Table({
        name: 'conversations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'brand_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'messages',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'engagement_score',
            type: 'float',
            isNullable: false,
            default: 0,
          },
          {
            name: 'analyzed_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create index on brand_id
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_BRAND_ID',
        columnNames: ['brand_id'],
      }),
    );

    // Create index on analyzed_at
    await queryRunner.createIndex(
      'conversations',
      new TableIndex({
        name: 'IDX_CONVERSATIONS_ANALYZED_AT',
        columnNames: ['analyzed_at'],
      }),
    );

    // Create conversation_insights table
    await queryRunner.createTable(
      new Table({
        name: 'conversation_insights',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'confidence',
            type: 'float',
            isNullable: false,
          },
          {
            name: 'details',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign key from conversation_insights to conversations
    await queryRunner.createForeignKey(
      'conversation_insights',
      new TableForeignKey({
        name: 'FK_CONVERSATION_INSIGHTS_CONVERSATION',
        columnNames: ['conversation_id'],
        referencedTableName: 'conversations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Create index on conversation_id
    await queryRunner.createIndex(
      'conversation_insights',
      new TableIndex({
        name: 'IDX_CONVERSATION_INSIGHTS_CONVERSATION_ID',
        columnNames: ['conversation_id'],
      }),
    );

    // Create composite index on type and category
    await queryRunner.createIndex(
      'conversation_insights',
      new TableIndex({
        name: 'IDX_CONVERSATION_INSIGHTS_TYPE_CATEGORY',
        columnNames: ['type', 'category'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'conversation_insights',
      'FK_CONVERSATION_INSIGHTS_CONVERSATION',
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'conversation_insights',
      'IDX_CONVERSATION_INSIGHTS_TYPE_CATEGORY',
    );
    await queryRunner.dropIndex(
      'conversation_insights',
      'IDX_CONVERSATION_INSIGHTS_CONVERSATION_ID',
    );
    await queryRunner.dropIndex(
      'conversations',
      'IDX_CONVERSATIONS_ANALYZED_AT',
    );
    await queryRunner.dropIndex('conversations', 'IDX_CONVERSATIONS_BRAND_ID');

    // Drop tables
    await queryRunner.dropTable('conversation_insights');
    await queryRunner.dropTable('conversations');
  }
}
