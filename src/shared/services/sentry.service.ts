import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';
import { User } from '../../auth/entities/user.entity';
import { LoggerService } from './logger.service';

interface SentryConfig {
  dsn: string;
  environment: string;
  release?: string;
  debug?: boolean;
  tracesSampleRate?: number;
}

//i hate this fucking robot
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SentryLogContext {
  error: SentryErrorResponse;
  context?: SentryContext;
}

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
  private readonly logger: LoggerService;
  private isInitialized = false;

  constructor(
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger.setContext('SentryService');
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

    // Create metadata for the logger
    const metadata = {
      error: errorResponse,
      context,
    };

    this.logger.error(message, undefined, undefined, metadata);
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

  /**
   * Set context information for the current scope
   * @param name Context name
   * @param context Context data
   */
  setContext(name: string, context: Record<string, unknown>): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setContext(name, context);
    } catch (error: unknown) {
      this.logError('Failed to set context in Sentry', error);
    }
  }
}
