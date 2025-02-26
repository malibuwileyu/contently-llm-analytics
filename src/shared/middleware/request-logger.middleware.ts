import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { v4 as uuidv4 } from 'uuid';

// Extend the Express Request interface to include correlationId
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

/**
 * Middleware for logging HTTP requests and responses
 * Adds a correlation ID to each request for tracing
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('HTTP');
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Generate a unique correlation ID for this request
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req.correlationId = correlationId;
    
    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    
    // Get request information
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    
    // Log the request
    this.logger.info(`Request ${method} ${originalUrl}`, undefined, {
      correlationId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });
    
    // Get the start time
    const start = Date.now();
    
    // Log the response when it's sent
    res.on('finish', () => {
      // Calculate request duration
      const duration = Date.now() - start;
      
      // Get response information
      const { statusCode } = res;
      
      // Determine log level based on status code
      if (statusCode >= 500) {
        this.logger.error(`Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`, undefined, undefined, {
          correlationId,
          statusCode,
          duration,
        });
      } else if (statusCode >= 400) {
        this.logger.warn(`Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`, undefined, {
          correlationId,
          statusCode,
          duration,
        });
      } else {
        this.logger.info(`Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`, undefined, {
          correlationId,
          statusCode,
          duration,
        });
      }
    });
    
    // Continue to the next middleware or route handler
    next();
  }
} 