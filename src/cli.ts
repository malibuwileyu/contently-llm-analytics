import { CommandFactory } from 'nest-commander';
import { AnalyticsModule } from './analytics/analytics.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { CompetitorEntity } from './modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from './modules/brand-analytics/entities/industry.entity';
import { QueryTemplateEntity } from './analytics/entities/query-template.entity';
import { CompanyProfileEntity } from './analytics/entities/company-profile.entity';
import { AnalyticsResult } from './analytics/entities/analytics-result.entity';
import { AnalyticsJob } from './analytics/entities/analytics-job.entity';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: `postgresql://postgres.hgmbooestwqhfempyjun:${process.env.SUPABASE_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`,
      ssl: {
        rejectUnauthorized: false
      },
      entities: [
        CompetitorEntity,
        IndustryEntity,
        QueryTemplateEntity,
        CompanyProfileEntity,
        AnalyticsResult,
        AnalyticsJob
      ],
      synchronize: false,
    }),
    AnalyticsModule,
  ],
})
class CommandModule {}

async function bootstrap() {
  await CommandFactory.run(CommandModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
}

bootstrap(); 