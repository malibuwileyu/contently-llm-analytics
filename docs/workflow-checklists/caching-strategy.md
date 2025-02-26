# Caching Strategy

## Overview

This document outlines the caching strategy for the Contently LLM Analytics platform, detailing where and how caching should be implemented across different features and components.

## Cache Layers

### 1. Application Cache (Redis)
- **TTL Strategy**: Default 5 minutes, configurable per use case
- **Storage**: In-memory with persistence
- **Distribution**: Shared across service instances

### 2. Local Memory Cache
- **TTL Strategy**: Short-lived (1 minute max)
- **Storage**: Process memory
- **Use Cases**: High-frequency, read-only data

### 3. Database Query Cache
- **TTL Strategy**: Based on data volatility
- **Storage**: Redis
- **Invalidation**: Event-driven

## Feature-Specific Caching

### 1. Authentication & Authorization
```typescript
// Current Implementation
interface AuthCache {
  userTokens: {
    ttl: 300; // 5 minutes
    invalidation: 'on-logout';
  };
  userPermissions: {
    ttl: 600; // 10 minutes
    invalidation: 'on-role-change';
  };
}
```

### 2. Answer Engine Insights
```typescript
interface AnswerEngineCache {
  brandMentions: {
    ttl: 1800; // 30 minutes
    invalidation: 'scheduled';
  };
  sentimentAnalysis: {
    ttl: 3600; // 1 hour
    invalidation: 'on-update';
  };
  brandHealthScores: {
    ttl: 7200; // 2 hours
    invalidation: 'on-metric-change';
  };
}
```

### 3. Conversation Explorer
```typescript
interface ConversationCache {
  queryTrends: {
    ttl: 900; // 15 minutes
    invalidation: 'scheduled';
  };
  topicClusters: {
    ttl: 3600; // 1 hour
    invalidation: 'on-new-data';
  };
  contentSuggestions: {
    ttl: 1800; // 30 minutes
    invalidation: 'on-update';
  };
}
```

### 4. Agent Analytics
```typescript
interface AgentCache {
  botDetectionResults: {
    ttl: 300; // 5 minutes
    invalidation: 'on-detection';
  };
  crawlPatterns: {
    ttl: 1800; // 30 minutes
    invalidation: 'scheduled';
  };
  optimizationSuggestions: {
    ttl: 3600; // 1 hour
    invalidation: 'on-update';
  };
}
```

## Cache Implementation Patterns

### 1. Service-Level Caching
```typescript
@Injectable()
export class CacheableService {
  constructor(private cacheService: CacheService) {}

  @Cacheable({
    ttl: 300,
    key: (args) => `${this.constructor.name}:${args[0]}`,
  })
  async getData(id: string): Promise<Data> {
    // Implementation
  }
}
```

### 2. Query-Level Caching
```typescript
@Injectable()
export class QueryService {
  async getResults(query: QueryParams): Promise<Results> {
    const cacheKey = this.generateCacheKey(query);
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.executeQuery(query),
      this.determineTTL(query)
    );
  }
}
```

### 3. Response Caching
```typescript
@Controller('api')
export class ApiController {
  @Get('data')
  @CacheResponse({
    ttl: 300,
    key: (req) => `response:${req.url}:${req.query}`,
  })
  async getData(): Promise<Data> {
    // Implementation
  }
}
```

## Cache Invalidation Strategies

### 1. Time-Based Invalidation
- Default TTL per cache type
- Sliding expiration for frequently accessed data
- Scheduled cleanup for stale data

### 2. Event-Based Invalidation
```typescript
@Injectable()
export class CacheInvalidationService {
  @OnEvent('data.updated')
  async invalidateCache(event: DataUpdateEvent): Promise<void> {
    const patterns = this.determineInvalidationPatterns(event);
    await this.cacheService.invalidateByPatterns(patterns);
  }
}
```

### 3. Selective Invalidation
```typescript
interface InvalidationStrategy {
  pattern: string;
  condition: (event: any) => boolean;
  cascade: boolean;
}
```

## Monitoring & Metrics

### 1. Cache Performance Metrics
```typescript
interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  avgAccessTime: number;
}
```

### 2. Health Checks
```typescript
@Injectable()
export class CacheHealthIndicator {
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    return {
      cache: {
        status: await this.checkCacheConnection(),
        metrics: await this.getCacheMetrics(),
      },
    };
  }
}
```

## Implementation Guidelines

### 1. When to Cache
- Frequently accessed, rarely changed data
- Computationally expensive operations
- Rate-limited external API responses
- Session data and user preferences

### 2. When Not to Cache
- Rapidly changing data
- User-specific sensitive information
- Non-idempotent operation results
- Low-cost database queries

### 3. Cache Key Design
```typescript
interface CacheKeyStrategy {
  prefix: string;
  version: string;
  parameters: string[];
  separator: string;
}
```

## Error Handling

### 1. Cache Failures
```typescript
@Injectable()
export class CacheErrorHandler {
  async handleCacheError(error: CacheError): Promise<void> {
    if (error.type === 'connection') {
      await this.failoverToBackup();
    } else if (error.type === 'capacity') {
      await this.evictLowPriorityItems();
    }
  }
}
```

### 2. Fallback Strategies
```typescript
interface CacheFallback {
  strategy: 'local-cache' | 'direct-query' | 'stale-data';
  maxAttempts: number;
  timeout: number;
}
``` 