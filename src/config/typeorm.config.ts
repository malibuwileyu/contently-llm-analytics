import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

@Injectable()
export class TypeOrmConfigService {
  constructor(private configService: ConfigService) {
    console.log('TypeOrmConfigService constructor called');
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    console.log('Creating TypeORM options...');
    const password = this.configService.get('SUPABASE_PASSWORD');
    if (!password) {
      console.error('SUPABASE_PASSWORD is not configured');
      throw new Error('SUPABASE_PASSWORD is not configured');
    }

    const connectionString = `postgresql://postgres.hgmbooestwqhfempyjun:${password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
    console.log('Database connection string created (password hidden)');

    const options = {
      type: 'postgres',
      url: connectionString,
      schema: 'auth',
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: ['error', 'schema', 'warn', 'info', 'log', 'migration', 'query'],
      maxQueryExecutionTime: 1000,
      poolSize: 5,
      retryAttempts: 5,
      retryDelay: 3000,
      connectTimeoutMS: 60000,
      applicationName: 'contently-llm-analytics',
      ssl: true,
      extra: {
        ssl: {
          rejectUnauthorized: false,
        },
      },
    } as DataSourceOptions;

    console.log('TypeORM options created successfully');
    return options;
  }
}
