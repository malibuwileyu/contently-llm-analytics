import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

interface LogContext {
  correlationId?: string;
  environment?: string;
  [key: string]: unknown;
}

interface LogMessage {
  message: string;
  error?: Error;
  context?: LogContext;
  meta?: Record<string, unknown>;
}

type LogLevel = 'info' | 'error' | 'warn' | 'debug' | 'verbose';

/**
 * Logger service that extends NestJS Logger with Winston integration
 * Provides structured logging with different log levels and formats
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor(private readonly configService: ConfigService) {
    this.initializeLogger();
  }

  /**
   * Initialize Winston logger with appropriate transports and formats
   */
  private initializeLogger(): void {
    const { combine, timestamp, printf, colorize, json } = winston.format;

    // Define log format for console output
    const consoleFormat = combine(
      colorize(),
      timestamp(),
      printf(
        ({
          level,
          message,
          timestamp,
          context,
          ...meta
        }: {
          level: LogLevel;
          message: string;
          timestamp: string;
          context?: string;
          [key: string]: unknown;
        }) => {
          return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        },
      ),
    );

    // Define log format for file output (JSON)
    const fileFormat = combine(timestamp(), json());

    // Create logger with console and file transports
    this.logger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      defaultMeta: {},
      transports: [
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
    });

    // Add file transport in production
    if (process.env.NODE_ENV === 'production') {
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: fileFormat,
        }),
      );
      this.logger.add(
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: fileFormat,
        }),
      );
    }
  }

  /**
   * Set the context for the logger
   * @param context The context name (usually the class or module name)
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Log a message at the 'log' level (alias for 'info')
   * @param message The message to log
   * @param context Optional context override
   * @param meta Optional metadata to include with the log
   */
  log(
    message: string | LogMessage,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.writeLog('info', message, context, undefined, meta);
  }

  /**
   * Log a message at the 'error' level
   * @param message The message to log
   * @param trace Optional stack trace
   * @param context Optional context override
   * @param meta Optional metadata to include with the log
   */
  error(
    message: string | Error | LogMessage,
    trace?: string,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.writeLog('error', message, context, trace, meta);
  }

  /**
   * Log a message at the 'warn' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Optional metadata to include with the log
   */
  warn(
    message: string | Error | LogMessage,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.writeLog('warn', message, context, undefined, meta);
  }

  /**
   * Log a message at the 'debug' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Optional metadata to include with the log
   */
  debug(
    message: string | Error | LogMessage,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.writeLog('debug', message, context, undefined, meta);
  }

  /**
   * Log a message at the 'verbose' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Optional metadata to include with the log
   */
  verbose(
    message: string | Error | LogMessage,
    context?: string,
    meta?: Record<string, unknown>,
  ): void {
    this.writeLog('verbose', message, context, undefined, meta);
  }

  private writeLog(
    level: LogLevel,
    message: string | Error | LogMessage,
    context?: string,
    trace?: string,
    meta?: Record<string, unknown>,
  ): void {
    const contextValue = context || this.context;
    const logFn = this.getLogFunction(level);

    if (typeof message === 'string') {
      logFn(message, {
        context: contextValue,
        ...(meta || {}),
      });
      if (trace) {
        logFn(trace);
      }
      return;
    }

    if (message instanceof Error) {
      logFn(message.message, {
        context: contextValue,
        stack: trace || message.stack,
        ...(meta || {}),
      });
      return;
    }

    const {
      message: msg,
      error,
      context: msgContext,
      meta: messageMeta,
    } = message as LogMessage;
    const combinedMeta = {
      ...(meta || {}),
      ...(messageMeta || {}),
    };

    let formattedMessage = msg;
    const logMeta: Record<string, unknown> = {
      context: contextValue,
      ...combinedMeta,
    };

    if (error) {
      logMeta.error = error.message;
      logMeta.stack = error.stack;
    }

    if (msgContext) {
      logMeta.messageContext = msgContext;
    }

    logFn(formattedMessage, logMeta);
    if (trace) {
      logFn(trace);
    }
  }

  private getLogFunction(
    level: LogLevel,
  ): (message: string, meta?: Record<string, unknown>) => void {
    switch (level) {
      case 'error':
        return this.logger.error.bind(this.logger);
      case 'warn':
        return this.logger.warn.bind(this.logger);
      case 'debug':
        return this.logger.debug.bind(this.logger);
      case 'verbose':
        return this.logger.verbose.bind(this.logger);
      default:
        return this.logger.info.bind(this.logger);
    }
  }
}
