import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository, ObjectLiteral } from 'typeorm';
import { createTestDatabaseModule } from '../database/test-database';

/**
 * Creates a test application with common configuration
 */
export async function createTestApp(
  imports: any[],
  providers: any[] = []
): Promise<INestApplication> {
  const testDb = await createTestDatabaseModule();
  
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [testDb, ...imports],
    providers: [...providers],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply global pipes and configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.init();
  return app;
}

/**
 * Waits for a condition to be true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Condition not met within timeout');
}

/**
 * Generates test data based on a factory function
 */
export function generateTestData<T>(
  factory: () => T,
  count: number
): T[] {
  return Array.from({ length: count }, factory);
}

/**
 * Cleans up test data
 */
export async function cleanupTestData(repositories: Repository<ObjectLiteral>[]): Promise<void> {
  for (const repository of repositories) {
    await repository.clear();
  }
}

/**
 * Test transaction wrapper
 */
export async function withTestTransaction<T>(
  repository: Repository<ObjectLiteral>,
  callback: () => Promise<T>
): Promise<T> {
  const queryRunner = repository.manager.connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  
  try {
    const result = await callback();
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}

/**
 * Creates a random date between two dates
 */
export function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Creates a date in the past
 */
export function pastDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Creates a date in the future
 */
export function futureDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Generates a random string
 */
export function randomString(length = 8): string {
  return Math.random().toString(36).substring(2, length + 2);
}

/**
 * Generates a random number between min and max
 */
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Picks a random item from an array
 */
export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks random items from an array
 */
export function randomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Generates a random email
 */
export function randomEmail(): string {
  return `test.${randomString()}@example.com`;
}

/**
 * Generates a random URL
 */
export function randomUrl(): string {
  return `https://example.com/${randomString()}`;
}

/**
 * Generates a random IP address
 */
export function randomIp(): string {
  return Array.from({ length: 4 }, () => randomNumber(0, 255)).join('.');
}

/**
 * Generates a random user agent string
 */
export function randomUserAgent(): string {
  const browsers = [
    'Chrome',
    'Firefox',
    'Safari',
    'Edge',
  ];
  const versions = [
    '100.0.0',
    '99.0.0',
    '98.0.0',
  ];
  const os = [
    'Windows NT 10.0',
    'Macintosh; Intel Mac OS X 10_15_7',
    'X11; Linux x86_64',
  ];
  
  return `Mozilla/5.0 (${randomItem(os)}) ${randomItem(browsers)}/${randomItem(versions)}`;
} 