import { Module, Global } from '@nestjs/common';
import { MainRunnerService } from './main-runner.service';
import { FeatureRegistryService } from './feature-registry.service';
import { RunnersController } from './runners.controller';
import { AnswerEngineModule } from '../../modules/answer-engine/answer-engine.module';

/**
 * Module for feature runners
 * Provides services for managing and executing feature runners
 */
@Global()
@Module({
  imports: [
    // Import modules that provide runners
    AnswerEngineModule,
  ],
  controllers: [
    RunnersController,
  ],
  providers: [
    MainRunnerService,
    FeatureRegistryService,
  ],
  exports: [
    MainRunnerService,
    FeatureRegistryService,
  ],
})
export class RunnersModule {} 