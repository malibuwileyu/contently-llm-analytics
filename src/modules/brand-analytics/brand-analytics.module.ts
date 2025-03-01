import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import * as repositories from './repositories';
import * as services from './services';
import * as controllers from './controllers';
import { AIProviderModule } from '../ai-provider/ai-provider.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      entities.BusinessCategoryEntity,
      entities.CompetitorEntity,
      entities.QueryTemplateEntity,
      entities.QueryEntity,
      entities.ResponseEntity,
      entities.MentionEntity,
      entities.AnalyticsResultEntity,
      entities.QueryMetadataEntity,
    ]),
    AIProviderModule,
  ],
  controllers: [
    controllers.QueryGeneratorController,
    controllers.QueryCategorizationController,
  ],
  providers: [
    // Repositories
    repositories.BusinessCategoryRepository,
    repositories.CompetitorRepository,
    repositories.MentionRepository,
    repositories.AnalyticsResultRepository,

    // Services
    services.MentionDetectionService,
    services.SentimentAnalysisService,
    services.AnalyticsComputationService,
    services.QueryGeneratorService,
    services.QueryCategorizationService,
  ],
  exports: [
    // Repositories
    repositories.BusinessCategoryRepository,
    repositories.CompetitorRepository,
    repositories.MentionRepository,
    repositories.AnalyticsResultRepository,

    // Services
    services.MentionDetectionService,
    services.SentimentAnalysisService,
    services.AnalyticsComputationService,
    services.QueryGeneratorService,
    services.QueryCategorizationService,
  ],
})
export class BrandAnalyticsModule {}
