import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const password = process.env.SUPABASE_PASSWORD;
if (!password) {
  throw new Error('SUPABASE_PASSWORD is not configured');
}

const connectionString = `postgresql://postgres.hgmbooestwqhfempyjun:${password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

const dataSourceOptions = {
  type: 'postgres' as const,
  url: connectionString,
  schema: 'public',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  logging: true,
  maxQueryExecutionTime: 1000,
  ssl: {
    rejectUnauthorized: false,
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
