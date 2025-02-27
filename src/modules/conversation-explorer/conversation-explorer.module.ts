import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { ConversationInsight } from './entities/conversation-insight.entity';
import { ConversationRepository } from './repositories/conversation.repository';
import { ConversationAnalyzerService } from './services/conversation-analyzer.service';
import { ConversationIndexerService } from './services/conversation-indexer.service';
import { ConversationExplorerService } from './services/conversation-explorer.service';
import { QueryTrendAnalysisService } from './services/query-trend-analysis.service';
import { TopicClusteringService } from './services/topic-clustering.service';
import { VolumeEstimationService } from './services/volume-estimation.service';
import { TopicGapAnalyzerService } from './services/topic-gap-analyzer.service';
import { ContentSuggestionService } from './services/content-suggestion.service';
import { ConversationExplorerController } from './controllers/conversation-explorer.controller';
import { QueryTrendController } from './controllers/query-trend.controller';
import { TopicClusteringController } from './controllers/topic-clustering.controller';
import { VolumeEstimationController } from './controllers/volume-estimation.controller';
import { TopicGapAnalyzerController } from './controllers/topic-gap-analyzer.controller';
import { ContentSuggestionController } from './controllers/content-suggestion.controller';
import { ConversationExplorerResolver } from './resolvers/conversation-explorer.resolver';
import { QueryTrendResolver } from './resolvers/query-trend.resolver';
import { TopicClusteringResolver } from './resolvers/topic-clustering.resolver';
import { VolumeEstimationResolver } from './resolvers/volume-estimation.resolver';
import { TopicGapAnalyzerResolver } from './resolvers/topic-gap-analyzer.resolver';
import { ContentSuggestionResolver } from './resolvers/content-suggestion.resolver';
import { CacheModule } from '@nestjs/cache-manager';
import { SearchModule } from '../search/search.module';
import { MetricsModule } from '../metrics/metrics.module';
import { NLPModule } from '../nlp/nlp.module';
import { Cache } from 'cache-manager';

/**
 * Interface for the cache service
 */
interface CacheService {
  getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;
}

/**
 * Module for the Conversation Explorer
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationInsight]),
    CacheModule.register({
      ttl: 15 * 60 * 1000, // 15 minutes
      max: 100, // maximum number of items in cache
    }),
    SearchModule,
    MetricsModule,
    NLPModule,
  ],
  controllers: [
    ConversationExplorerController,
    QueryTrendController,
    TopicClusteringController,
    VolumeEstimationController,
    TopicGapAnalyzerController,
    ContentSuggestionController,
  ],
  providers: [
    ConversationRepository,
    ConversationAnalyzerService,
    ConversationIndexerService,
    ConversationExplorerService,
    QueryTrendAnalysisService,
    TopicClusteringService,
    VolumeEstimationService,
    TopicGapAnalyzerService,
    ContentSuggestionService,
    ConversationExplorerResolver,
    QueryTrendResolver,
    TopicClusteringResolver,
    VolumeEstimationResolver,
    TopicGapAnalyzerResolver,
    ContentSuggestionResolver,
    {
      provide: 'CacheService',
      useFactory: (cacheManager: Cache): CacheService => ({
        getOrSet: async <T>(key: string, factory: () => Promise<T>, ttl = 900): Promise<T> => {
          let data = await cacheManager.get<T>(key);
          if (!data) {
            data = await factory();
            await cacheManager.set(key, data, ttl);
          }
          return data;
        },
      }),
      inject: ['CACHE_MANAGER'],
    },
  ],
  exports: [
    ConversationExplorerService,
    ConversationRepository,
    QueryTrendAnalysisService,
    TopicClusteringService,
    VolumeEstimationService,
    TopicGapAnalyzerService,
    ContentSuggestionService,
  ],
})
export class ConversationExplorerModule {} 