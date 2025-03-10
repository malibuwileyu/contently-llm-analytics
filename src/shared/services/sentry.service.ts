import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { User } from '../../auth/entities/user.entity';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  debug?: boolean;
  tracesSampleRate?: number;
}

interface SentryContext {
  user?: User;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

interface SentryError {
  message: string;
  name: string;
  stack?: string;
  cause?: Error;
}

type SentryEventId = string;

type SentryErrorResponse = {
  message: string;
  stack?: string;
  code?: string;
  details?: Record<string, unknown>;
};

type SentryLogContext = {
  error: SentryErrorResponse;
  context?: SentryContext;
};

type SentryLogMessage = {
  message: string;
  context: SentryLogContext;
};

interface SentryUserData {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

/**
 * Service for Sentry error tracking integration
 * Handles initialization, error capturing, and context management
 */
@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {
    this.logger.setContext('SentryService');
  }

  /**
   * Initialize Sentry when the module is initialized
   */
  onModuleInit(): void {
    const config = this.configService.get<SentryConfig>('sentry');
    if (!config?.dsn) {
      this.logger.warn('Sentry DSN not configured, error tracking disabled');
      return;
    }

    Sentry.init({
      dsn: config.dsn,
      environment: config.environment,
      release: config.release,
      debug: config.debug,
      tracesSampleRate: config.tracesSampleRate || 1.0,
    });

    this.isInitialized = true;
    this.logger.log('Sentry initialized successfully');
  }

  private logError(
    message: string,
    error: unknown,
    context?: SentryContext,
  ): void {
    const errorResponse: SentryErrorResponse = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    const logContext: SentryLogContext = { error: errorResponse, context };
    const logMessage: SentryLogMessage = { message, context: logContext };
    this.logger.error(logMessage.message, logMessage.context);
  }

  /**
   * Capture an exception in Sentry
   * @param error The error to capture
   * @param context Additional context to include
   */
  captureException(
    error: Error | SentryError,
    context?: SentryContext,
  ): SentryEventId {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Error not captured.');
      return '';
    }

    try {
      if (context?.user) {
        Sentry.setUser({
          id: context.user.id,
          email: context.user.email,
          username: context.user.username,
        });
      }

      if (context?.tags) {
        Sentry.setTags(context.tags);
      }

      if (context?.extra) {
        Sentry.setExtras(context.extra);
      }

      return Sentry.captureException(error);
    } catch (error: unknown) {
      this.logError('Failed to capture exception in Sentry', error, context);
      return '';
    }
  }

  /**
   * Capture a message in Sentry
   * @param message The message to capture
   * @param context Additional context to include
   */
  captureMessage(message: string, context?: SentryContext): SentryEventId {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Message not captured.');
      return '';
    }

    try {
      if (context?.user) {
        Sentry.setUser({
          id: context.user.id,
          email: context.user.email,
          username: context.user.username,
        });
      }

      if (context?.tags) {
        Sentry.setTags(context.tags);
      }

      if (context?.extra) {
        Sentry.setExtras(context.extra);
      }

      return Sentry.captureMessage(message);
    } catch (error: unknown) {
      this.logError('Failed to capture message in Sentry', error, context);
      return '';
    }
  }

  /**
   * Set user information for the current scope
   * @param user User information
   */
  setUser(user: SentryUserData): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setUser(user);
    } catch (error: unknown) {
      this.logError('Failed to set user in Sentry', error);
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
    } catch (error: unknown) {
      this.logError('Failed to set tag in Sentry', error);
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
    } catch (error: unknown) {
      this.logError('Failed to close Sentry', error);
      return false;
    }
  }

  setContext(name: string, context: Record<string, unknown>): void {
    try {
      Sentry.setContext(name, context);
    } catch (error: unknown) {
      this.logError('Failed to set context in Sentry', error);
    }
  }
}
