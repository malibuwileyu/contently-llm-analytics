import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create a data source for checking the schema
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  _username: process.env.DB_USERNAME || 'postgres',
  _password: process.env.SUPABASE_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          _rejectUnauthorized: false,
        }
      : false,
  _synchronize: false,
  logging: true,
});

// Check the database schema
async function checkSchema(): Promise<void> {
  try {
    await dataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Data Source has been initialized');

    // Check if the tables exist
    const tables = await dataSource.query(`
      SELECT tablename 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY tablename
    `);

    // eslint-disable-next-line no-console
    console.log('Tables in the database:');
    tables.forEach((table: { tablename: string }) => {
      // eslint-disable-next-line no-console
      console.log(`- ${table.tablename}`);
    });

    // Check the structure of the brand_mention table
    // eslint-disable-next-line no-console
    console.log('\nStructure of brand_mention table:');
    const brandMentionColumns = await dataSource.query(`
      SELECT columnname, datatype, isnullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND tablename = 'brand_mention'
      ORDER BY ordinal_position
    `);

    brandMentionColumns.forEach(
      (column: {
        columnname: string;
        datatype: string;
        isnullable: string;
      }) => {
        // eslint-disable-next-line no-console
        console.log(
          `- ${column.columnname}: ${column.datatype} (${column.isnullable === 'YES' ? 'nullable' : 'not nullable'})`,
        );
      },
    );

    // Check the structure of the citation table
    // eslint-disable-next-line no-console
    console.log('\nStructure of citation table:');
    const citationColumns = await dataSource.query(`
      SELECT columnname, datatype, isnullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND tablename = 'citation'
      ORDER BY ordinal_position
    `);

    citationColumns.forEach(
      (column: {
        columnname: string;
        datatype: string;
        isnullable: string;
      }) => {
        // eslint-disable-next-line no-console
        console.log(
          `- ${column.columnname}: ${column.datatype} (${column.isnullable === 'YES' ? 'nullable' : 'not nullable'})`,
        );
      },
    );

    // Check the indexes
    // eslint-disable-next-line no-console
    console.log('\nIndexes on brand_mention table:');
    const brandMentionIndexes = await dataSource.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'brand_mention'
      ORDER BY indexname
    `);

    brandMentionIndexes.forEach(
      (index: { indexname: string; indexdef: string }) => {
        // eslint-disable-next-line no-console
        console.log(`- ${index.indexname}: ${index.indexdef}`);
      },
    );

    // eslint-disable-next-line no-console
    console.log('\nIndexes on citation table:');
    const citationIndexes = await dataSource.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'citation'
      ORDER BY indexname
    `);

    citationIndexes.forEach(
      (index: { indexname: string; indexdef: string }) => {
        // eslint-disable-next-line no-console
        console.log(`- ${index.indexname}: ${index.indexdef}`);
      },
    );

    await dataSource.destroy();
    // eslint-disable-next-line no-console
    console.log('\nData Source has been closed');

    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema();
