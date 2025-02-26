import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { BaseError } from '../errors/base.error';
import { LoggerService } from './logger.service';

/**
 * Service for Sentry error tracking integration
 * Handles initialization, error capturing, and context management
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext('SentryService');
  }

  /**
   * Initialize Sentry when the module is initialized
   */
  onModuleInit() {
    const dsn = this.configService.get<string>('sentry.dsn');
    const environment = this.configService.get<string>('app.environment') || 'development';
    
    if (!dsn) {
      this.logger.warn('Sentry DSN not configured. Error tracking is disabled.');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        // Adjust sample rate based on environment
        tracesSampleRate: environment === 'production' ? 0.2 : 1.0,
        // Don't send events in development unless explicitly enabled
        beforeSend: (event) => {
          if (environment === 'development' && 
              !this.configService.get<boolean>('sentry.enableInDevelopment')) {
            return null;
          }
          return event;
        },
      });
      
      this.isInitialized = true;
      this.logger.log(`Sentry initialized in ${environment} environment`);
    } catch (error) {
      this.logger.error('Failed to initialize Sentry', error instanceof Error ? error.stack : undefined);
    }
  }

  /**
   * Capture an exception in Sentry
   * @param error The error to capture
   * @param context Additional context to include
   */
  captureException(error: Error | BaseError, context?: Record<string, any>): string {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Error not captured.');
      return '';
    }

    try {
      // Add BaseError specific information
      if (error instanceof BaseError) {
        Sentry.setTag('error.code', error.code);
        Sentry.setTag('error.status', error.status.toString());
        
        if (error.context) {
          // Add error context as extra data
          Object.entries(error.context).forEach(([key, value]) => {
            Sentry.setExtra(`error.context.${key}`, value);
          });
        }
      }

      // Add additional context
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          Sentry.setExtra(key, value);
        });
      }

      // Capture the exception
      return Sentry.captureException(error);
    } catch (e) {
      this.logger.error('Failed to capture exception in Sentry', e instanceof Error ? e.stack : undefined);
      return '';
    }
  }

  /**
   * Capture a message in Sentry
   * @param message The message to capture
   * @param level The severity level
   * @param context Additional context to include
   */
  captureMessage(
    message: string, 
    level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info',
    context?: Record<string, any>,
  ): string {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Message not captured.');
      return '';
    }

    try {
      // Add context information
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          Sentry.setExtra(key, value);
        });
      }

      // Capture the message with the specified level
      return Sentry.captureMessage(message, level);
    } catch (e) {
      this.logger.error('Failed to capture message in Sentry', e instanceof Error ? e.stack : undefined);
      return '';
    }
  }

  /**
   * Set user information for the current scope
   * @param user User information
   */
  setUser(user: { id: string; email?: string; username?: string; [key: string]: any }): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (e) {
      this.logger.error('Failed to set user in Sentry', e instanceof Error ? e.stack : undefined);
    }
  }

  /**
   * Set a tag on the current scope
   * @param key Tag key
   * @param value Tag value
   */
  setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (e) {
      this.logger.error('Failed to set tag in Sentry', e instanceof Error ? e.stack : undefined);
    }
  }

  /**
   * Flush all events before the process exits
   * @param timeout Maximum time to wait in ms
   */
  async close(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) {
      return true;
    }

    try {
      return Sentry.close(timeout);
    } catch (e) {
      this.logger.error('Failed to close Sentry', e instanceof Error ? e.stack : undefined);
      return false;
    }
  }
} 