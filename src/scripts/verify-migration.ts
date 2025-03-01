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

// Verify the migration
async function verifyMigration(): Promise<void> {
  try {
    await dataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Data Source has been initialized');

    // Check if the migrations table exists and has our migration
    // eslint-disable-next-line no-console
    console.log('\nChecking migrations table:');
    const migrations = await dataSource.query(`
      SELECT * FROM migrations
      ORDER BY id DESC
    `);

    // eslint-disable-next-line no-console
    console.log('Migrations in the database:');
    migrations.forEach(
      (migration: { id: number; timestamp: number; name: string }) => {
        // eslint-disable-next-line no-console
        console.log(
          `- ${migration.id}: ${migration.name} (${migration.timestamp})`,
        );
      },
    );

    // Check if the brand_mention table exists and has the correct structure
    // eslint-disable-next-line no-console
    console.log('\nChecking brand_mention table:');
    const brandMentionExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND tablename = 'brand_mention'
      )
    `);

    if (brandMentionExists[0].exists) {
      // eslint-disable-next-line no-console
      console.log('brand_mention table exists');

      // Check the columns
      const brandMentionColumns = await dataSource.query(`
        SELECT columnname, datatype, isnullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND tablename = 'brand_mention'
        ORDER BY ordinal_position
      `);

      // eslint-disable-next-line no-console
      console.log('brand_mention columns:');
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
    } else {
      // eslint-disable-next-line no-console
      console.error('brand_mention table does not exist!');
    }

    // Check if the citation table exists and has the correct structure
    // eslint-disable-next-line no-console
    console.log('\nChecking citation table:');
    const citationExists = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND tablename = 'citation'
      )
    `);

    if (citationExists[0].exists) {
      // eslint-disable-next-line no-console
      console.log('citation table exists');

      // Check the columns
      const citationColumns = await dataSource.query(`
        SELECT columnname, datatype, isnullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND tablename = 'citation'
        ORDER BY ordinal_position
      `);

      // eslint-disable-next-line no-console
      console.log('citation columns:');
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
    } else {
      // eslint-disable-next-line no-console
      console.error('citation table does not exist!');
    }

    // Check if the foreign key exists
    // eslint-disable-next-line no-console
    console.log('\nChecking foreign key:');
    const foreignKey = await dataSource.query(`
      SELECT
        tc.constraintname,
        tc.tablename,
        kcu.columnname,
        ccu.tablename AS foreign_tablename,
        ccu.columnname AS foreign_columnname
      FROM
        information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraintname = kcu.constraintname
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraintname = tc.constraintname
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constrainttype = 'FOREIGN KEY'
        AND tc.tablename = 'citation'
        AND ccu.tablename = 'brand_mention'
    `);

    if (foreignKey.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Foreign key exists:');
      foreignKey.forEach(
        (fk: {
          constraintname: string;
          tablename: string;
          columnname: string;
          foreign_tablename: string;
          foreign_columnname: string;
        }) => {
          // eslint-disable-next-line no-console
          console.log(
            `- ${fk.constraintname}: ${fk.tablename}.${fk.columnname} -> ${fk.foreign_tablename}.${fk.foreign_columnname}`,
          );
        },
      );
    } else {
      // eslint-disable-next-line no-console
      console.error('Foreign key does not exist!');
    }

    // Check if the indexes exist
    // eslint-disable-next-line no-console
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

    // eslint-disable-next-line no-console
    console.log('_Indexes:');
    indexes.forEach(
      (index: { tablename: string; indexname: string; indexdef: string }) => {
        // eslint-disable-next-line no-console
        console.log(
          `- ${index.tablename}.${index.indexname}: ${index.indexdef}`,
        );
      },
    );

    await dataSource.destroy();
    // eslint-disable-next-line no-console
    console.log('\nData Source has been closed');

    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error verifying migration:', error);
    process.exit(1);
  }
}

verifyMigration();
