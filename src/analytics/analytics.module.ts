import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AnalyticsResult } from './entities/analytics-result.entity';
import { AnalyticsJob } from './entities/analytics-job.entity';
import { BrandVisibilityService } from './services/brand-visibility.service';
import { QuestionValidatorService } from './services/question-validator.service';
import { DatabaseSeedingService } from './services/database-seeding.service';
import { AnalyticsJobProcessorService } from './services/analytics-job-processor.service';
import { SeedDatabaseCommand } from './commands/seed-database.command';
import { ProcessAnalyticsCommand } from './commands/process-analytics.command';
import { AIProviderModule } from '../modules/ai-provider/ai-provider.module';
import { BrandAnalyticsModule } from '../modules/brand-analytics/brand-analytics.module';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';
import { BrandVisibilityRunner } from './runners/brand-visibility.runner';
import { AnalyticsProcessorService } from './services/analytics-processor.service';
import { NLPModule } from '../modules/nlp/nlp.module';
import { VisibilityAnalyticsService } from './services/visibility-analytics.service';
import { PerplexityService } from './services/perplexity.service';
import { ComparativeQueryService } from './services/comparative-query.service';
import { CompetitorAnalysisService } from './services/competitor-analysis.service';
import { CompanyProfileEntity } from './entities/company-profile.entity';
import { ContextQueryService } from './services/context-query.service';
import { VariableBankService } from './services/variable-bank.service';
import { QueryTemplateEntity } from './entities/query-template.entity';
import { QueryValidationService } from './services/query-validation.service';
import { QueryTemplateService } from './services/query-template.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './services/analytics.service';
import { DashboardService } from './services/dashboard.service';
import { CustomersModule } from '../customers/customers.module';
import { AnalyticsResultRepository } from './repositories/analytics-result.repository';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      CompetitorEntity,
      IndustryEntity,
      AnalyticsResult,
      AnalyticsJob,
      CompanyProfileEntity,
      QueryTemplateEntity
    ]),
    AIProviderModule,
    BrandAnalyticsModule,
    NLPModule,
    CustomersModule,
    SupabaseModule,
    AuthModule
  ],
  controllers: [AnalyticsController],
  providers: [
    BrandVisibilityService,
    QuestionValidatorService,
    DatabaseSeedingService,
    AnalyticsJobProcessorService,
    SeedDatabaseCommand,
    ProcessAnalyticsCommand,
    BrandVisibilityRunner,
    AnalyticsProcessorService,
    VisibilityAnalyticsService,
    PerplexityService,
    ComparativeQueryService,
    CompetitorAnalysisService,
    ContextQueryService,
    VariableBankService,
    QueryValidationService,
    QueryTemplateService,
    AnalyticsService,
    DashboardService,
    AnalyticsResultRepository
  ],
  exports: [
    BrandVisibilityService,
    QuestionValidatorService,
    DatabaseSeedingService,
    AnalyticsJobProcessorService,
    BrandVisibilityRunner,
    AnalyticsProcessorService,
    VisibilityAnalyticsService,
    PerplexityService,
    ComparativeQueryService,
    CompetitorAnalysisService,
    ContextQueryService,
    VariableBankService,
    QueryValidationService,
    QueryTemplateService,
    AnalyticsService,
    AnalyticsResultRepository
  ]
})
export class AnalyticsModule {}
