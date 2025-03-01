import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create and export the DataSource instance
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  _username: process.env.DB_USERNAME || 'postgres',
  _password: process.env.SUPABASE_PASSWORD || 'postgres',
  _database: process.env.DB_NAME || 'postgres',
  _schema: process.env.DB_SCHEMA || 'public',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          _rejectUnauthorized: false,
        }
      : false,
  _synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
