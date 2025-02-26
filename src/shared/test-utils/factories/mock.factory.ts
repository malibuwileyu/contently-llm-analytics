import { Repository, ObjectLiteral, SelectQueryBuilder, EntityManager } from 'typeorm';

/**
 * Type for mocked functions with proper return type inference
 */
export type MockFunction<T = any, Y extends any[] = any[]> = jest.Mock<Promise<T> | T, Y>;

/**
 * Type for mocked repositories and services with proper method typing
 */
export type MockType<T> = {
  [P in keyof T]: T[P] extends (...args: any[]) => any
    ? MockFunction<ReturnType<T[P]>, Parameters<T[P]>>
    : T[P];
};

/**
 * Type for mocked query builder with chainable methods
 */
export type MockQueryBuilder = {
  [P in keyof SelectQueryBuilder<any>]: P extends 'getOne' | 'getMany' | 'execute'
    ? MockFunction
    : MockFunction<MockQueryBuilder>;
};

/**
 * Creates a mock repository with common methods and proper typing
 */
export const createMockRepository = <T extends ObjectLiteral>() => {
  const queryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    execute: jest.fn(),
  };

  const manager = {
    transaction: jest.fn((cb) => Promise.resolve(cb())),
  } as unknown as EntityManager;

  return {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    softDelete: jest.fn(),
    restore: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => queryBuilder),
    manager,
  } as unknown as Repository<T>;
};

/**
 * Creates a mock service with all methods mocked
 */
export const createMockService = <T extends object>(): MockType<T> => {
  const mockService = {} as MockType<T>;

  // Get all methods from the prototype chain
  const proto = Object.getPrototypeOf({}) as T;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (typeof proto[key as keyof T] === 'function') {
      mockService[key as keyof T] = jest.fn() as any;
    }
  }

  return mockService;
};

/**
 * Creates a partial mock that preserves some real implementations
 */
export const createPartialMock = <T extends object>(
  real: T,
  mockedMethods: Array<keyof T>
): MockType<T> => {
  const mock = { ...real } as MockType<T>;
  
  for (const method of mockedMethods) {
    if (typeof real[method] === 'function') {
      mock[method] = jest.fn() as any;
    }
  }

  return mock;
};

/**
 * Helper to create a mock error
 */
export const createMockError = (
  message: string,
  code?: string,
  additionalProps?: Record<string, unknown>
): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  if (additionalProps) {
    Object.assign(error, additionalProps);
  }
  return error;
};

/**
 * Helper to create spy functions with type inference
 */
export const createTypedSpy = <T extends (...args: any[]) => any>(): jest.SpyInstance<ReturnType<T>, Parameters<T>> => {
  return jest.fn() as jest.SpyInstance<ReturnType<T>, Parameters<T>>;
};

/**
 * Helper to create a mock promise that can be controlled in tests
 */
export class MockPromise<T> {
  private resolver!: (value: T) => void;
  private rejecter!: (error: Error) => void;
  readonly promise: Promise<T>;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolver = resolve;
      this.rejecter = reject;
    });
  }

  resolve(value: T): void {
    this.resolver(value);
  }

  reject(error: Error): void {
    this.rejecter(error);
  }
} 