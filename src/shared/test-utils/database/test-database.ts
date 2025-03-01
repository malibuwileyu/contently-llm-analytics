import { TypeOrmModule } from '@nestjs/typeorm';
import { DynamicModule } from '@nestjs/common';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

/**
 * Creates a test database module for integration tests
 * @param entities Entities to include in the test database
 * @returns TypeORM module configured for testing
 */
export function createTestDatabaseModule(
  entities: EntityClassOrSchema[] = [],
): DynamicModule {
  return TypeOrmModule.forRoot({
    type: 'sqlite',
    database: ':memory:',
    entities,
    _synchronize: true,
    _dropSchema: true,
    logging: false,
  });
}

/**
 * Test database class for E2E tests
 */
export class TestDatabase {
  private static instance: TestDatabase;
  public readonly url: string;

  private constructor() {
    this.url = ':memory:';
  }

  /**
   * Creates a test database instance
   * @returns TestDatabase instance
   */
  public static async create(): Promise<TestDatabase> {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  /**
   * Destroys the test database
   */
  public async destroy(): Promise<void> {
    // No need to do anything for in-memory SQLite
  }
}
