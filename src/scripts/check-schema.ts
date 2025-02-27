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
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.SUPABASE_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  synchronize: false,
  logging: true,
});

// Check the database schema
async function checkSchema(): Promise<void> {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized');
    
    // Check if the tables exist
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('Tables in the database:');
    tables.forEach((table: { table_name: string }) => {
      console.log(`- ${table.table_name}`);
    });
    
    // Check the structure of the brand_mention table
    console.log('\nStructure of brand_mention table:');
    const brandMentionColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'brand_mention'
      ORDER BY ordinal_position
    `);
    
    brandMentionColumns.forEach((column: { column_name: string, data_type: string, is_nullable: string }) => {
      console.log(`- ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check the structure of the citation table
    console.log('\nStructure of citation table:');
    const citationColumns = await dataSource.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'citation'
      ORDER BY ordinal_position
    `);
    
    citationColumns.forEach((column: { column_name: string, data_type: string, is_nullable: string }) => {
      console.log(`- ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
    });
    
    // Check the indexes
    console.log('\nIndexes on brand_mention table:');
    const brandMentionIndexes = await dataSource.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'brand_mention'
      ORDER BY indexname
    `);
    
    brandMentionIndexes.forEach((index: { indexname: string, indexdef: string }) => {
      console.log(`- ${index.indexname}: ${index.indexdef}`);
    });
    
    console.log('\nIndexes on citation table:');
    const citationIndexes = await dataSource.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'citation'
      ORDER BY indexname
    `);
    
    citationIndexes.forEach((index: { indexname: string, indexdef: string }) => {
      console.log(`- ${index.indexname}: ${index.indexdef}`);
    });
    
    await dataSource.destroy();
    console.log('\nData Source has been closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema(); 