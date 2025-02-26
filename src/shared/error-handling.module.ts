import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggerService } from './services/logger.service';
import { SentryService } from './services/sentry.service';
import { SentryInterceptor } from './interceptors/sentry.interceptor';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';

/**
 * Global module for error handling and logging components
 * Provides exception filters, interceptors, and services for error handling
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    // Services
    LoggerService,
    SentryService,
    
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    
    // Sentry interceptor for error tracking
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor,
    },
  ],
  exports: [
    LoggerService,
    SentryService,
  ],
})
export class ErrorHandlingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger middleware to all routes
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
} 