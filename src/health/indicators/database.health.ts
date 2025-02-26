import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(DatabaseHealthIndicator.name);

  constructor(@InjectConnection() private connection: Connection) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check if the database connection is established
      if (!this.connection.isConnected) {
        this.logger.warn('Database connection is not established, attempting to connect...');
        
        try {
          // Try to connect if not already connected
          await this.connection.connect();
        } catch (connectError) {
          this.logger.error(`Failed to establish database connection: ${connectError.message}`);
          return this.getStatus(key, false, { 
            message: 'Database connection failed',
            error: connectError instanceof Error ? connectError.message : 'Unknown error' 
          });
        }
      }

      // Execute a simple query to verify the connection is working
      await this.connection.query('SELECT 1');
      
      return this.getStatus(key, true);
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      
      // If we're in development mode, return a more graceful response
      if (process.env.NODE_ENV === 'development') {
        return this.getStatus(key, false, { 
          message: 'Database connection issue (development mode)',
          error: error instanceof Error ? error.message : 'Unknown database error',
          developmentMode: true
        });
      }
      
      return this.getStatus(key, false, { 
        message: error instanceof Error ? error.message : 'Unknown database error',
        error: error 
      });
    }
  }
} 