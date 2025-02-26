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
import { SupabaseModule } from './supabase/supabase.module';
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
      context: ({ req }) => ({ req }),
    }),

    // Database - Make it optional for development
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: ['dist/**/*.entity{.ts,.js}'],
        migrations: ['dist/migrations/*{.ts,.js}'],
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        // Allow the application to start even if the database connection fails
        retryAttempts: process.env.NODE_ENV === 'development' ? 0 : 10,
        retryDelay: 3000,
        // Add connection timeout
        connectTimeoutMS: 10000,
        // Add extra options for better error handling
        extra: {
          // Increase timeout for operations
          statement_timeout: 10000,
          // Increase connection timeout
          connectionTimeoutMillis: 10000,
          // Increase idle timeout
          idleTimeoutMillis: 30000,
          // Maximum number of clients the pool should contain
          max: 20,
        },
        // Add keepConnectionAlive to prevent connection issues
        keepConnectionAlive: true,
      }),
    }),

    // Feature Modules
    ErrorHandlingModule,
    HealthModule,
    LoggerModule,
    SupabaseModule,
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
export class AppModule {}
