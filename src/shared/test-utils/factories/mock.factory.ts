import {
  Repository,
  ObjectLiteral,
  SelectQueryBuilder,
  EntityManager,
} from 'typeorm';

export type MockFunction<
  TReturn,
  TArgs extends unknown[] = unknown[],
> = jest.Mock<Promise<TReturn> | TReturn, TArgs>;

export type MockType<T> = {
  [P in keyof T]: T[P] extends (...args: unknown[]) => unknown
    ? MockFunction<ReturnType<T[P]>, Parameters<T[P]>>
    : T[P];
};

export type MockQueryBuilder = {
  [P in keyof SelectQueryBuilder<ObjectLiteral>]: P extends
    | 'getOne'
    | 'getMany'
    | 'execute'
    ? MockFunction<unknown>
    : MockFunction<MockQueryBuilder>;
};

export interface MockOptions<T> {
  partial?: boolean;
  overrides?: Partial<T>;
}

export interface MockFactoryResult<T> {
  build: (overrides?: Partial<T>) => T;
  buildList: (count: number, overrides?: Partial<T>) => T[];
  buildPartial: (overrides?: Partial<T>) => Partial<T>;
}

export function createMockFactory<T extends Record<string, unknown>>(
  defaults: T | (() => T),
): MockFactoryResult<T> {
  function getDefaults(): T {
    return typeof defaults === 'function'
      ? (defaults as () => T)()
      : { ...defaults };
  }

  return {
    build: (overrides: Partial<T> = {}): T => ({
      ...getDefaults(),
      ...overrides,
    }),

    buildList: (count: number, overrides: Partial<T> = {}): T[] =>
      Array.from({ length: count }, () => ({
        ...getDefaults(),
        ...overrides,
      })),

    buildPartial: (overrides: Partial<T> = {}): Partial<T> => ({
      ...overrides,
    }),
  };
}

export function createRepositoryMock<T extends ObjectLiteral>(): MockType<
  Repository<T>
> {
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
  } as MockQueryBuilder;

  const manager = {
    transaction: jest.fn(cb => Promise.resolve(cb())),
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
  } as unknown as MockType<Repository<T>>;
}

export function createMockService<
  T extends Record<string, unknown>,
>(): MockType<T> {
  const mockService = {} as MockType<T>;

  // Get all methods from the prototype chain
  const proto = Object.getPrototypeOf({}) as T;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (typeof proto[key as keyof T] === 'function') {
      mockService[key as keyof T] = jest.fn() as any;
    }
  }

  return mockService;
}

export function createPartialMock<T extends Record<string, unknown>>(
  real: T,
  mockedMethods: Array<keyof T>,
): MockType<T> {
  const mock = { ...real } as MockType<T>;

  for (const method of mockedMethods) {
    if (typeof real[method] === 'function') {
      mock[method] = jest.fn() as any;
    }
  }

  return mock;
}

export function createMockError(
  message: string,
  code?: string,
  additionalProps?: Record<string, unknown>,
): Error {
  const error = new Error(message);
  if (code) {
    Object.defineProperty(error, 'code', { value: code });
  }
  if (additionalProps) {
    Object.assign(error, additionalProps);
  }
  return error;
}

export function createTypedSpy<
  TFunc extends (...args: unknown[]) => unknown,
>(): jest.SpyInstance<ReturnType<TFunc>, Parameters<TFunc>> {
  return jest.fn() as jest.SpyInstance<ReturnType<TFunc>, Parameters<TFunc>>;
}

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
