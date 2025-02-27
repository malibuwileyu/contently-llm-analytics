import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create a data source for migrations
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.SUPABASE_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
  entities: [path.join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  synchronize: false,
  logging: true,
});

// Initialize the data source and run migrations
async function runMigrations(): Promise<void> {
  try {
    await dataSource.initialize();
    // eslint-disable-next-line no-console
    console.log('Data Source has been initialized');
    
    await dataSource.runMigrations();
    // eslint-disable-next-line no-console
    console.log('Migrations have been run');
    
    await dataSource.destroy();
    // eslint-disable-next-line no-console
    console.log('Data Source has been closed');
    
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations(); 