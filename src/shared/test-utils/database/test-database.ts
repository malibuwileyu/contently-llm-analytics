import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Client } from 'pg';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import { getRepositoryToken } from '@nestjs/typeorm';

/**
 * Creates a test database configuration for integration tests
 */
export async function createTestDatabaseModule(entities: EntityClassOrSchema[] = []): Promise<DynamicModule> {
  const dbName = `test_${uuidv4().replace(/-/g, '_')}`;
  
  // Create test database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE ${dbName}`);
  } finally {
    await client.end();
  }

  // Create TypeORM module with test configuration
  const typeOrmModule = TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: dbName,
    entities: entities,
    synchronize: true, // Only for tests
    dropSchema: true, // Clean up after tests
    autoLoadEntities: false, // We'll explicitly load entities
  });

  // Create feature module for entities
  const featureModule = TypeOrmModule.forFeature(entities);

  // Return a dynamic module that includes both modules
  return {
    module: class TestDatabaseModule {},
    imports: [typeOrmModule, featureModule],
    exports: [typeOrmModule, featureModule],
    providers: [
      ...entities.map(entity => ({
        provide: getRepositoryToken(entity),
        useValue: entity,
      })),
    ],
  };
}

/**
 * Test database helper class
 */
export class TestDatabase {
  private readonly dbName: string;
  private client: Client;

  constructor() {
    this.dbName = `test_${uuidv4().replace(/-/g, '_')}`;
  }

  /**
   * Creates a test database instance
   */
  static async create(): Promise<TestDatabase> {
    const db = new TestDatabase();
    await db.setup();
    return db;
  }

  /**
   * Sets up the test database
   */
  private async setup(): Promise<void> {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres' // Connect to default database first
    });

    await this.client.connect();
    await this.client.query(`CREATE DATABASE ${this.dbName}`);
    await this.client.end();
  }

  /**
   * Cleans up the test database
   */
  async cleanup(): Promise<void> {
    this.client = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: 'postgres' // Connect to default database first
    });

    await this.client.connect();
    
    // Terminate all connections to the test database
    await this.client.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '${this.dbName}'
      AND pid <> pg_backend_pid();
    `);
    
    await this.client.query(`DROP DATABASE IF EXISTS ${this.dbName}`);
    await this.client.end();
  }

  /**
   * Gets the database URL
   */
  get url(): string {
    return `postgres://${process.env.DB_USERNAME || 'postgres'}:${
      process.env.DB_PASSWORD || 'postgres'
    }@${process.env.DB_HOST || 'localhost'}:${
      process.env.DB_PORT || '5432'
    }/${this.dbName}`;
  }
} 