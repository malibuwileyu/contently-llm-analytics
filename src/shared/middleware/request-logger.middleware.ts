import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/logger.service';
import { v4 as uuidv4 } from 'uuid';

// Define HTTP status code constants
const HTTP_STATUS = {
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
};

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
    const correlationId =
      (req.headers['x-correlation-id'] as string) || uuidv4();
    req.correlationId = correlationId;

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);

    // Get request information
    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';

    // Log the request
    this.logger.log(`Request ${method} ${originalUrl}`);

    // Get the start time
    const startTime = Date.now();

    // Add response listener using the correct type
    const resStream = res as unknown as {
      on: (event: string, _callback: () => void) => void;
    };
    resStream.on('finish', () => {
      const duration = Date.now() - startTime;

      // Get response information
      const { statusCode } = res;

      // Determine log level based on status code
      if (statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
        );
      } else if (statusCode >= HTTP_STATUS.BAD_REQUEST) {
        this.logger.warn(
          `Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
        );
      } else {
        this.logger.log(
          `Response ${statusCode} ${method} ${originalUrl} - ${duration}ms`,
        );
      }
    });

    // Continue to the next middleware or route handler
    next();
  }
}
