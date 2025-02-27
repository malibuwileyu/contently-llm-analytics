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

// Verify the migration
async function verifyMigration() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized');
    
    // Check if the migrations table exists and has our migration
    console.log('\nChecking migrations table:');
    const migrations = await dataSource.query(`
      SELECT * FROM migrations
      ORDER BY id DESC
    `);
    
    console.log('Migrations in the database:');
    migrations.forEach((migration: { id: number, timestamp: number, name: string }) => {
      console.log(`- ${migration.id}: ${migration.name} (${migration.timestamp})`);
    });
    
    // Check if the brand_mention table exists and has the correct structure
    console.log('\nChecking brand_mention table:');
    const brandMentionExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'brand_mention'
      )
    `);
    
    if (brandMentionExists[0].exists) {
      console.log('brand_mention table exists');
      
      // Check the columns
      const brandMentionColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'brand_mention'
        ORDER BY ordinal_position
      `);
      
      console.log('brand_mention columns:');
      brandMentionColumns.forEach((column: { column_name: string, data_type: string, is_nullable: string }) => {
        console.log(`- ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    } else {
      console.error('brand_mention table does not exist!');
    }
    
    // Check if the citation table exists and has the correct structure
    console.log('\nChecking citation table:');
    const citationExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'citation'
      )
    `);
    
    if (citationExists[0].exists) {
      console.log('citation table exists');
      
      // Check the columns
      const citationColumns = await dataSource.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'citation'
        ORDER BY ordinal_position
      `);
      
      console.log('citation columns:');
      citationColumns.forEach((column: { column_name: string, data_type: string, is_nullable: string }) => {
        console.log(`- ${column.column_name}: ${column.data_type} (${column.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
      });
    } else {
      console.error('citation table does not exist!');
    }
    
    // Check if the foreign key exists
    console.log('\nChecking foreign key:');
    const foreignKey = await dataSource.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'citation'
        AND ccu.table_name = 'brand_mention'
    `);
    
    if (foreignKey.length > 0) {
      console.log('Foreign key exists:');
      foreignKey.forEach((fk: { constraint_name: string, table_name: string, column_name: string, foreign_table_name: string, foreign_column_name: string }) => {
        console.log(`- ${fk.constraint_name}: ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
      });
    } else {
      console.error('Foreign key does not exist!');
    }
    
    // Check if the indexes exist
    console.log('\nChecking indexes:');
    const indexes = await dataSource.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM
        pg_indexes
      WHERE
        tablename IN ('brand_mention', 'citation')
      ORDER BY
        tablename, indexname
    `);
    
    console.log('Indexes:');
    indexes.forEach((index: { tablename: string, indexname: string, indexdef: string }) => {
      console.log(`- ${index.tablename}.${index.indexname}: ${index.indexdef}`);
    });
    
    await dataSource.destroy();
    console.log('\nData Source has been closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error verifying migration:', error);
    process.exit(1);
  }
}

verifyMigration(); 