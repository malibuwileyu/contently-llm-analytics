import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { QueryTemplateEntity } from '../analytics/entities/query-template.entity';
import { AnalyticsResult } from '../analytics/entities/analytics-result.entity';

dotenv.config();

const configService = new ConfigService();

const supabasePassword = configService.get<string>('SUPABASE_PASSWORD');

if (!supabasePassword) {
  throw new Error('SUPABASE_PASSWORD must be configured');
}

const connectionString = `postgresql://postgres.hgmbooestwqhfempyjun:${supabasePassword}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

export const FEATURE_FLAGS = {
  ENABLE_COMPETITIVE_QUERIES: false,
  // Add other feature flags here as needed
} as const;

const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  entities: [
    'dist/**/*.entity{.ts,.js}',
    'src/**/*.entity{.ts,.js}',
    IndustryEntity,
    CompetitorEntity,
    QueryTemplateEntity,
    AnalyticsResult
  ],
  synchronize: false,
  logging: ['error', 'schema', 'warn'],
  migrations: [
    'src/migrations/*.ts'
  ],
  extra: {
    // Add any extra options here
  }
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
