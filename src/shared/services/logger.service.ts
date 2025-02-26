import { Injectable, LoggerService as NestLoggerService, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { BaseError } from '../errors/base.error';

/**
 * Logger service that extends NestJS Logger with Winston integration
 * Provides structured logging with different log levels and formats
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private logger: winston.Logger;

  constructor() {
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
      printf(({ level, message, timestamp, context, ...meta }: {
        level: string;
        message: string;
        timestamp: string;
        context?: string;
        [key: string]: any;
      }) => {
        return `${timestamp} [${context || 'Application'}] ${level}: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      }),
    );

    // Define log format for file output (JSON)
    const fileFormat = combine(
      timestamp(),
      json(),
    );

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
   * @param meta Additional metadata
   */
  log(message: any, context?: string, ...meta: any[]): void {
    this.info(message, context, ...meta);
  }

  /**
   * Log a message at the 'error' level
   * @param message The message to log
   * @param trace Optional stack trace
   * @param context Optional context override
   * @param meta Additional metadata
   */
  error(message: any, trace?: string, context?: string, ...meta: any[]): void {
    const contextValue = context || this.context;
    
    // Handle error objects
    if (message instanceof Error) {
      const errorMeta = message instanceof BaseError 
        ? { 
            code: message.code, 
            status: message.status, 
            errorContext: message.context 
          }
        : {};
      
      this.logger.error(message.message, {
        context: contextValue,
        stack: trace || message.stack,
        ...errorMeta,
        ...this.flattenMeta(meta),
      });
      return;
    }
    
    this.logger.error(message, {
      context: contextValue,
      stack: trace,
      ...this.flattenMeta(meta),
    });
  }

  /**
   * Log a message at the 'warn' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Additional metadata
   */
  warn(message: any, context?: string, ...meta: any[]): void {
    const contextValue = context || this.context;
    
    if (message instanceof Error) {
      this.logger.warn(message.message, {
        context: contextValue,
        stack: message.stack,
        ...this.flattenMeta(meta),
      });
      return;
    }
    
    this.logger.warn(message, {
      context: contextValue,
      ...this.flattenMeta(meta),
    });
  }

  /**
   * Log a message at the 'debug' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Additional metadata
   */
  debug(message: any, context?: string, ...meta: any[]): void {
    const contextValue = context || this.context;
    
    this.logger.debug(message, {
      context: contextValue,
      ...this.flattenMeta(meta),
    });
  }

  /**
   * Log a message at the 'verbose' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Additional metadata
   */
  verbose(message: any, context?: string, ...meta: any[]): void {
    const contextValue = context || this.context;
    
    this.logger.verbose(message, {
      context: contextValue,
      ...this.flattenMeta(meta),
    });
  }

  /**
   * Log a message at the 'info' level
   * @param message The message to log
   * @param context Optional context override
   * @param meta Additional metadata
   */
  info(message: any, context?: string, ...meta: any[]): void {
    const contextValue = context || this.context;
    
    this.logger.info(message, {
      context: contextValue,
      ...this.flattenMeta(meta),
    });
  }

  /**
   * Flatten metadata array into a single object
   * @param meta Array of metadata objects
   * @returns Flattened metadata object
   */
  private flattenMeta(meta: any[]): Record<string, unknown> {
    if (!meta || meta.length === 0) {
      return {};
    }
    
    if (meta.length === 1 && typeof meta[0] === 'object') {
      return meta[0];
    }
    
    return { meta };
  }
} 