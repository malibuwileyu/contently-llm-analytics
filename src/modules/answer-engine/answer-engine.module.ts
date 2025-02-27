import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandMention } from './entities/brand-mention.entity';
import { Citation } from './entities/citation.entity';
import { BrandMentionRepository } from './repositories/brand-mention.repository';
import { SentimentAnalyzerService } from './services/sentiment-analyzer.service';
import { CitationTrackerService } from './services/citation-tracker.service';
import { AnswerEngineService } from './services/answer-engine.service';
import { AnswerResolver } from './graphql/answer.resolver';
import { AnalyticsGateway } from './websocket/analytics.gateway';
import { AnswerEngineRunner } from './runners/answer-engine.runner';
import { PrometheusMetricsService } from '../../metrics/services/prometheus-metrics.service';
import { NLPService } from './services/nlp.service';
import { AuthorityCalculatorService } from './services/authority-calculator.service';
import { PubSub } from 'graphql-subscriptions';

/**
 * Module for the Answer Engine feature
 * Provides sentiment analysis and brand mention tracking
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandMention,
      Citation
    ])
  ],
  providers: [
    // Repositories
    BrandMentionRepository,
    
    // Services
    SentimentAnalyzerService,
    CitationTrackerService,
    AnswerEngineService,
    
    // GraphQL Resolver
    AnswerResolver,
    
    // WebSocket Gateway
    AnalyticsGateway,
    
    // Runner
    AnswerEngineRunner,
    
    // NLP Service implementation
    NLPService,
    {
      provide: 'NLPService',
      useExisting: NLPService
    },
    
    // Authority Calculator implementation
    AuthorityCalculatorService,
    {
      provide: 'AuthorityCalculatorService',
      useExisting: AuthorityCalculatorService
    },
    
    // Metrics Service implementation
    {
      provide: 'MetricsService',
      useExisting: PrometheusMetricsService
    },
    
    // PubSub for GraphQL subscriptions
    {
      provide: 'PUB_SUB',
      useFactory: (): PubSub => {
        return new PubSub();
      }
    }
  ],
  exports: [
    AnswerEngineService,
    AnswerEngineRunner
  ]
})
export class AnswerEngineModule {} 