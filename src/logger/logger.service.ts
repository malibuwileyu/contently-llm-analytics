import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

type LogLevel = 'log' | 'error' | 'warn' | 'debug';

/**
 * Logger service that provides consistent logging across the application.
 * In development, logs are written to console for convenience.
 * In production, this should be replaced with proper file/service logging.
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private formatMessage(message: string, context?: string): string {
    return `[${new Date().toISOString()}] [${context || 'Application'}] ${message}`;
  }

  private writeToFile(level: LogLevel, message: string): void {
    // In development, we use console for immediate feedback
    // In production, this should be replaced with proper logging
    if (process.env.NODE_ENV !== 'production') {
      /* eslint-disable no-console */
      switch (level) {
        case 'log':
          console.log(message);
          break;
        case 'error':
          console.error(message);
          break;
        case 'warn':
          console.warn(message);
          break;
        case 'debug':
          console.debug(message);
          break;
      }
      /* eslint-enable no-console */
    }
  }

  log(message: string, context?: string): void {
    this.writeToFile('log', this.formatMessage(message, context));
  }

  error(message: string, trace?: string, context?: string): void {
    const formattedMessage = this.formatMessage(message, context);
    this.writeToFile('error', formattedMessage);
    if (trace) {
      this.writeToFile('error', trace);
    }
  }

  warn(message: string, context?: string): void {
    this.writeToFile('warn', this.formatMessage(message, context));
  }

  debug(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.writeToFile('debug', this.formatMessage(message, context));
    }
  }

  verbose(message: string, context?: string): void {
    if (process.env.NODE_ENV !== 'production') {
      this.writeToFile('log', this.formatMessage(message, context));
    }
  }
}
