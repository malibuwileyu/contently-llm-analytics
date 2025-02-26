# Contently AI-Friendly Development Guidelines

## Core Principles

1. **AI Context-Aware Development**
   - Keep files under 250 lines to optimize for AI context windows
   - Break complex features into modular components
   - Use clear, descriptive naming for better AI comprehension
   - Include type definitions and interfaces for better code analysis

2. **Runner Pattern Implementation**
   ```typescript
   // src/modules/feature/runners/feature.runner.ts
   export class FeatureRunner {
     private service: FeatureService;
     
     constructor() {
       // Initialize dependencies
       const dependency1 = new Dependency1();
       const dependency2 = new Dependency2();
       
       this.service = new FeatureService(
         dependency1,
         dependency2
       );
     }
     
     async run(context: Context): Promise<Result> {
       return this.service.execute(context);
     }
   }
   ```

3. **Modular File Organization**
   ```
   src/
   ├── modules/
   │   └── feature/
   │       ├── runners/
   │       │   └── feature.runner.ts
   │       ├── services/
   │       │   ├── feature.service.ts
   │       │   └── sub-feature.service.ts
   │       ├── models/
   │       │   └── feature.model.ts
   │       └── utils/
   │           └── feature.utils.ts
   ```

## File Structure Guidelines

### 1. File Length Limits
- TypeScript implementation files: 250 lines max
- Test files: 250 lines max
- Runner files: 100 lines max (orchestration only)
- Interface/Type definition files: 150 lines max

### 2. File Organization Pattern
```typescript
// 1. Imports
import { Required } from '@dependencies';

// 2. Types & Interfaces
interface FeatureConfig {
  // Configuration type definitions
}

// 3. Constants
const DEFAULT_CONFIG = {
  // Default values
};

// 4. Class Implementation
export class FeatureService {
  // Implementation
}
```

### 3. Runner File Best Practices
- Keep runners thin and focused on orchestration
- Move business logic to service classes
- Use dependency injection for better testing
- Implement clear error boundaries
- Add logging for better observability

## Code Style Guidelines

### 1. Type Safety
```typescript
// Good
interface UserContext {
  id: string;
  permissions: string[];
}

function processUser(context: UserContext): void {
  // Implementation
}

// Bad
function processUser(context: any): void {
  // Implementation
}
```

### 2. Error Handling
```typescript
// Domain-specific errors
class FeatureError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FeatureError';
  }
}

// Error handling pattern
try {
  await feature.process();
} catch (error) {
  if (error instanceof FeatureError) {
    logger.error(`Feature Error ${error.code}:`, {
      message: error.message,
      context: error.context
    });
  } else {
    logger.error('Unknown error:', error);
    throw error;
  }
}
```

### 3. Async Patterns
```typescript
// Good
async function processFeature(): Promise<Result> {
  const data = await fetchData();
  return processData(data);
}

// Bad
function processFeature(): Promise<Result> {
  return fetchData().then(data => {
    return processData(data);
  });
}
```

## Testing Guidelines

### 1. Test Structure
```typescript
describe('FeatureService', () => {
  let service: FeatureService;
  let dependencies: MockDependencies;

  beforeEach(() => {
    dependencies = createMockDependencies();
    service = new FeatureService(dependencies);
  });

  describe('process', () => {
    test('should handle valid input', async () => {
      // Arrange
      const input = createValidInput();
      
      // Act
      const result = await service.process(input);
      
      // Assert
      expect(result).toMatchExpectedOutput();
    });
  });
});
```

### 2. Test Coverage Requirements
- Unit tests: 90% coverage minimum
- Integration tests: Critical paths covered
- E2E tests: Main user flows covered
- Performance tests: API endpoints and DB queries

## Performance Guidelines

### 1. Caching Strategy
```typescript
class FeatureCache {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private config: CacheConfig
  ) {}

  async getCached<T>(key: string, fetch: () => Promise<T>): Promise<T> {
    const cached = await this.cache.get<T>(key);
    if (cached) return cached;

    const fresh = await fetch();
    await this.cache.set(key, fresh, this.config.ttl);
    return fresh;
  }
}
```

### 2. Memory Management
```typescript
class FeatureComponent {
  private subscriptions: Subscription[] = [];

  initialize(): void {
    this.subscriptions.push(
      this.eventBus.subscribe('event', this.handleEvent)
    );
  }

  cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
```

## Documentation Requirements

### 1. Code Documentation
```typescript
/**
 * Processes feature request and generates recommendations
 * @param context - The feature context containing user preferences
 * @returns Promise resolving to feature recommendations
 * @throws FeatureError if processing fails
 */
async function processFeature(context: FeatureContext): Promise<Recommendations> {
  // Implementation
}
```

### 2. README Requirements
- Feature overview
- Setup instructions
- Configuration options
- API documentation
- Example usage
- Troubleshooting guide

## AI-Friendly Development Tips

1. **Clear Component Boundaries**
   - Keep components focused and single-purpose
   - Use clear interfaces between components
   - Document component relationships
   - Maintain consistent naming conventions

2. **Code Searchability**
   - Use meaningful file names
   - Add descriptive comments for complex logic
   - Include type definitions
   - Document public APIs

3. **Context Window Optimization**
   - Break large files into smaller modules
   - Keep related code close together
   - Use clear section markers
   - Minimize code duplication

4. **Error Traceability**
   - Use specific error types
   - Include context in error messages
   - Log relevant debugging information
   - Maintain error boundaries

## Tech Stack Integration

### 1. NestJS Services
```typescript
@Injectable()
export class FeatureService {
  constructor(
    private readonly repository: FeatureRepository,
    private readonly cache: FeatureCache
  ) {}

  async process(input: Input): Promise<Output> {
    // Implementation
  }
}
```

### 2. TypeORM Repositories
```typescript
@EntityRepository(Feature)
export class FeatureRepository extends Repository<Feature> {
  async findWithRelations(id: string): Promise<Feature> {
    return this.findOne(id, {
      relations: ['dependencies']
    });
  }
}
```

### 3. GraphQL Resolvers
```typescript
@Resolver(Feature)
export class FeatureResolver {
  @Query(() => [Feature])
  async features(
    @Args() args: FeatureArgs
  ): Promise<Feature[]> {
    return this.featureService.find(args);
  }
}
```

## Security Guidelines

1. **Input Validation**
   - Validate all user inputs
   - Use type-safe parsers
   - Implement request schemas
   - Sanitize data before processing

2. **Authentication & Authorization**
   - Use JWT tokens
   - Implement role-based access
   - Validate permissions
   - Secure sensitive routes

3. **Data Protection**
   - Encrypt sensitive data
   - Use secure communication
   - Implement rate limiting
   - Follow OWASP guidelines 