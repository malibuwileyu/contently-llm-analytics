import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { RealTimeModule } from './modules/real-time/real-time.module';
import { ErrorHandlingModule } from './shared/error-handling.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggerService } from './shared/services/logger.service';
import { SentryService } from './shared/services/sentry.service';
import { MetricsModule } from './metrics/metrics.module';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import sentryConfig from './config/sentry.config';
import redisConfig from './config/redis.config';
import healthConfig from './config/health.config';
import { createMetricsConfig } from './config/metrics.config';
import type { Request } from 'express';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, sentryConfig, redisConfig, healthConfig, createMetricsConfig],
    }),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: process.env.NODE_ENV === 'development',
      context: ({ req }: { req: Request }): { req: Request } => ({ req }),
    }),

    // Database - Make it optional for development
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const dbConfig = configService.get('app.database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          schema: dbConfig.schema,
          ssl: {
            rejectUnauthorized: false // Required for Supabase pooler connection
          },
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false, // Disable synchronize as we'll use migrations
          logging: process.env.NODE_ENV === 'development',
          retryAttempts: 3,
          retryDelay: 3000,
          extra: {
            max: dbConfig.pooling.max,
            min: dbConfig.pooling.min,
            idleTimeoutMillis: dbConfig.pooling.idleTimeoutMillis,
            connectionTimeoutMillis: dbConfig.pooling.connectionTimeoutMillis,
          }
        };
      },
    }),

    // Feature Modules
    ErrorHandlingModule,
    HealthModule,
    LoggerModule,
    AuthModule,
    CacheModule,
    RealTimeModule,
    
    // Metrics Module
    MetricsModule.register({
      isGlobal: true,
      registerController: true,
      config: {
        enabled: process.env.METRICS_ENABLED === 'true',
        prefix: process.env.METRICS_PREFIX || 'contently_',
        endpoint: process.env.METRICS_ENDPOINT || '/metrics',
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Register the global exception filter at the app level
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    LoggerService,
    SentryService,
  ],
})
export class AppModule {
  constructor(private configService: ConfigService) {}
}
