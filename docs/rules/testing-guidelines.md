# Testing Guidelines

## Core Testing Principles

1. **Test-Driven Development (TDD)**
   - Write tests before implementation
   - Follow Red-Green-Refactor cycle
   - Keep tests focused and atomic
   - Test one behavior per test case

2. **Coverage Requirements**
   - Unit tests: 90% coverage minimum
   - Integration tests: Critical paths covered
   - E2E tests: Main user flows covered
   - Performance tests: API endpoints and DB queries

## Test Organization

### 1. File Structure
```typescript
// src/modules/feature/__tests__/
├── unit/
│   ├── feature.service.spec.ts
│   └── feature.utils.spec.ts
├── integration/
│   └── feature.integration.spec.ts
└── e2e/
    └── feature.e2e.spec.ts
```

### 2. Test File Length
- Maximum 250 lines per test file
- Break into multiple files by test category
- Use shared test fixtures and helpers
- Keep setup/teardown code minimal

## Unit Testing

### 1. Service Tests
```typescript
describe('FeatureService', () => {
  let service: FeatureService;
  let repository: MockType<FeatureRepository>;
  let cache: MockType<FeatureCache>;

  beforeEach(() => {
    repository = createMock<FeatureRepository>();
    cache = createMock<FeatureCache>();
    service = new FeatureService(repository, cache);
  });

  describe('process', () => {
    test('should successfully process valid input', async () => {
      // Arrange
      const input = createValidInput();
      repository.findOne.mockResolvedValue(mockEntity);
      
      // Act
      const result = await service.process(input);
      
      // Assert
      expect(result).toMatchObject(expectedOutput);
      expect(repository.findOne).toHaveBeenCalledWith(input.id);
    });

    test('should throw FeatureError for invalid input', async () => {
      // Arrange
      const invalidInput = createInvalidInput();
      
      // Act & Assert
      await expect(service.process(invalidInput))
        .rejects
        .toThrow(FeatureError);
    });
  });
});
```

### 2. Repository Tests
```typescript
describe('FeatureRepository', () => {
  let repository: FeatureRepository;
  let queryRunner: QueryRunner;

  beforeEach(async () => {
    queryRunner = createMock<QueryRunner>();
    repository = getCustomRepository(FeatureRepository);
  });

  test('should find entity with relations', async () => {
    // Arrange
    const id = 'test-id';
    const expectedRelations = ['dependencies', 'metadata'];

    // Act
    await repository.findWithRelations(id);

    // Assert
    expect(repository.findOne).toHaveBeenCalledWith(id, {
      relations: expectedRelations
    });
  });
});
```

## Integration Testing

### 1. API Integration Tests
```typescript
describe('Feature API Integration', () => {
  let app: INestApplication;
  let repository: FeatureRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FeatureModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    
    repository = moduleRef.get<FeatureRepository>(FeatureRepository);
  });

  test('should create feature', async () => {
    // Arrange
    const input = createFeatureInput();

    // Act
    const response = await request(app.getHttpServer())
      .post('/api/features')
      .send(input)
      .expect(201);

    // Assert
    expect(response.body).toMatchObject({
      id: expect.any(String),
      ...input
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
```

### 2. GraphQL Integration Tests
```typescript
describe('Feature GraphQL Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FeatureModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  test('should query features', async () => {
    const query = `
      query GetFeatures($input: FeaturesInput!) {
        features(input: $input) {
          id
          name
          status
        }
      }
    `;

    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables: { input: { status: 'ACTIVE' } }
      })
      .expect(200);

    expect(response.body.data.features).toBeInstanceOf(Array);
  });
});
```

## E2E Testing

### 1. Setup
```typescript
import { getE2ETestApp } from '@test/utils';

describe('Feature E2E', () => {
  let app: INestApplication;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await TestDatabase.create();
    app = await getE2ETestApp({
      database: database.url,
    });
  });

  afterAll(async () => {
    await database.destroy();
    await app.close();
  });
});
```

### 2. User Flow Tests
```typescript
test('complete feature workflow', async () => {
  // 1. Create feature
  const feature = await createFeature(app);
  
  // 2. Update feature
  await updateFeature(app, feature.id);
  
  // 3. Verify feature state
  const updated = await getFeature(app, feature.id);
  expect(updated.status).toBe('UPDATED');
  
  // 4. Delete feature
  await deleteFeature(app, feature.id);
  
  // 5. Verify deletion
  await expect(getFeature(app, feature.id))
    .rejects
    .toThrow(NotFoundException);
});
```

## Performance Testing

### 1. Load Tests
```typescript
import { LoadTest } from '@test/performance';

describe('Feature Load Tests', () => {
  test('should handle concurrent requests', async () => {
    const loadTest = new LoadTest({
      endpoint: '/api/features',
      method: 'GET',
      concurrent: 100,
      duration: '30s'
    });

    const results = await loadTest.run();
    
    expect(results.p95).toBeLessThan(200); // 200ms
    expect(results.errors).toBe(0);
  });
});
```

### 2. Stress Tests
```typescript
test('should handle database load', async () => {
  const stressTest = new StressTest({
    operation: 'createFeatures',
    batchSize: 1000,
    totalOperations: 100000
  });

  const results = await stressTest.run();
  
  expect(results.averageLatency).toBeLessThan(100); // 100ms
  expect(results.successRate).toBeGreaterThan(0.99); // 99%
});
```

## Mocking Guidelines

### 1. Service Mocks
```typescript
const createServiceMock = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

type MockType<T> = {
  [P in keyof T]: jest.Mock<any>;
};
```

### 2. Repository Mocks
```typescript
const createRepositoryMock = <T>(): MockType<Repository<T>> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});
```

## Test Utilities

### 1. Test Data Factories
```typescript
export const createTestFeature = (
  overrides: Partial<Feature> = {}
): Feature => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});
```

### 2. Test Helpers
```typescript
export const waitForCondition = async (
  condition: () => Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error('Condition not met within timeout');
};
``` 