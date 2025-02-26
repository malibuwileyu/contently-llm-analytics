# Contently LLM Analytics - Software Design Document (SDD)

## 1. Software Components

### 1.1 Core Services

#### AnswerEngineService
```typescript
interface AnswerEngineService {
  // Core functionality
  trackBrandMentions(brand: Brand): Promise<MentionTracker>;
  analyzeSentiment(content: string): Promise<SentimentAnalysis>;
  calculateCitationAuthority(sources: Source[]): Promise<AuthorityScore>;
  
  // Monitoring
  startMonitoring(config: MonitoringConfig): Promise<void>;
  stopMonitoring(): Promise<void>;
  
  // Reporting
  generateInsightsReport(params: ReportParams): Promise<InsightsReport>;
}
```

#### ConversationExplorerService
```typescript
interface ConversationExplorerService {
  // Query analysis
  analyzeQueryTrends(timeframe: TimeFrame): Promise<QueryTrends>;
  identifyEmergingTopics(): Promise<Topic[]>;
  
  // Volume estimation
  estimateSearchVolume(query: string): Promise<VolumeEstimate>;
  
  // Topic mapping
  mapTopicClusters(queries: Query[]): Promise<TopicMap>;
}
```

#### AgentAnalyticsService
```typescript
interface AgentAnalyticsService {
  // Crawler tracking
  trackAIBots(): Promise<BotActivity[]>;
  analyzeCrawlPatterns(): Promise<CrawlAnalysis>;
  
  // Optimization
  suggestOptimizations(): Promise<Optimization[]>;
  validateImplementation(optimization: Optimization): Promise<ValidationResult>;
}
```

### 1.2 Data Models

#### Brand Entity
```typescript
interface Brand {
  id: string;
  name: string;
  domains: string[];
  competitors: string[];
  trackingConfig: {
    keywords: string[];
    excludeKeywords: string[];
    languages: string[];
    regions: string[];
  };
  settings: {
    alertThresholds: AlertThresholds;
    reportingSchedule: Schedule;
    userAccess: Access[];
  };
}
```

#### Analytics Models
```typescript
interface AnalyticsData {
  brand: Brand;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    visibility: VisibilityScore;
    sentiment: SentimentScore;
    shareOfVoice: ShareOfVoice;
    topQueries: Query[];
    emergingTopics: Topic[];
  };
  trends: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
}
```

## 2. Module Design

### 2.1 AI Platform Integration Module

#### Platform Connector Factory
```typescript
class PlatformConnectorFactory {
  static createConnector(platform: AIPlatform): AIPlatformConnector {
    switch (platform) {
      case AIPlatform.ChatGPT:
        return new ChatGPTConnector();
      case AIPlatform.Perplexity:
        return new PerplexityConnector();
      case AIPlatform.Copilot:
        return new CopilotConnector();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}
```

#### Data Collection Pipeline
```typescript
class DataCollectionPipeline {
  private connectors: Map<AIPlatform, AIPlatformConnector>;
  private processor: DataProcessor;
  private storage: DataStorage;

  async collect(): Promise<void> {
    for (const connector of this.connectors.values()) {
      const rawData = await connector.fetchData();
      const processedData = await this.processor.process(rawData);
      await this.storage.store(processedData);
    }
  }
}
```

### 2.2 Analytics Engine Module

#### Visibility Score Calculator
```typescript
class VisibilityScoreCalculator {
  private weights: {
    mentions: number;
    sentiment: number;
    authority: number;
  };

  calculate(data: AnalyticsInput): VisibilityScore {
    return {
      overall: this.calculateOverallScore(data),
      components: {
        mentions: this.calculateMentionScore(data.mentions),
        sentiment: this.calculateSentimentScore(data.sentiment),
        authority: this.calculateAuthorityScore(data.authority)
      }
    };
  }
}
```

#### Trend Analysis Engine
```typescript
class TrendAnalysisEngine {
  private config: TrendConfig;
  private analyzer: TimeSeriesAnalyzer;

  async analyzeTrends(data: TimeSeriesData): Promise<TrendAnalysis> {
    const decomposed = await this.analyzer.decompose(data);
    return {
      trend: decomposed.trend,
      seasonality: decomposed.seasonality,
      anomalies: this.detectAnomalies(decomposed),
      forecast: await this.generateForecast(decomposed)
    };
  }
}
```

## 3. Service Implementation

### 3.1 Real-time Processing Service
```typescript
@Injectable()
class RealTimeProcessor {
  constructor(
    private eventBus: EventBus,
    private cache: CacheService,
    private analyzer: AnalyticsEngine
  ) {}

  @Subscribe('mention.detected')
  async handleMention(mention: BrandMention): Promise<void> {
    const enriched = await this.enrichMention(mention);
    const analysis = await this.analyzer.analyze(enriched);
    await this.updateMetrics(analysis);
    await this.notifySubscribers(analysis);
  }
}
```

### 3.2 Reporting Service
```typescript
@Injectable()
class ReportingService {
  constructor(
    private dataStore: DataStore,
    private templateEngine: TemplateEngine,
    private notifier: NotificationService
  ) {}

  async generateReport(params: ReportParams): Promise<Report> {
    const data = await this.dataStore.query(params);
    const insights = await this.analyzeInsights(data);
    const report = await this.templateEngine.render(insights);
    await this.notifier.sendReport(report);
    return report;
  }
}
```

## 4. Database Schema

### 4.1 PostgreSQL Tables

```sql
-- Brand mentions table
CREATE TABLE brand_mentions (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  platform VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  sentiment FLOAT,
  timestamp TIMESTAMP WITH TIME ZONE,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics metrics table
CREATE TABLE analytics_metrics (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  metric_type VARCHAR(50) NOT NULL,
  value FLOAT NOT NULL,
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.2 Redis Caching

```typescript
interface CacheConfig {
  // Real-time metrics
  realtimeMetrics: {
    ttl: number;
    pattern: string;
  };
  
  // API response cache
  apiCache: {
    ttl: number;
    maxSize: number;
  };
  
  // Session storage
  sessions: {
    ttl: number;
    refreshThreshold: number;
  };
}
```

## 5. API Design

### 5.1 RESTful Endpoints

```typescript
@Controller('api/v1')
class AnalyticsController {
  @Get('brands/:brandId/mentions')
  async getBrandMentions(
    @Param('brandId') brandId: string,
    @Query() query: MentionQuery
  ): Promise<PaginatedResponse<BrandMention>> {
    // Implementation
  }

  @Get('brands/:brandId/analytics')
  async getBrandAnalytics(
    @Param('brandId') brandId: string,
    @Query() query: AnalyticsQuery
  ): Promise<AnalyticsResponse> {
    // Implementation
  }
}
```

### 5.2 WebSocket Events

```typescript
interface WebSocketEvents {
  // Real-time updates
  'mention.new': BrandMention;
  'analytics.update': AnalyticsUpdate;
  'alert.triggered': Alert;
  
  // Status updates
  'crawler.status': CrawlerStatus;
  'system.health': HealthStatus;
}
```

## 6. Error Handling

### 6.1 Domain Errors
```typescript
class AnalyticsError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

enum ErrorCode {
  INVALID_DATA = 'INVALID_DATA',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT = 'RATE_LIMIT'
}
```

### 6.2 Error Handlers
```typescript
@Injectable()
class GlobalErrorHandler implements ErrorHandler {
  handleError(error: Error): void {
    if (error instanceof AnalyticsError) {
      this.handleAnalyticsError(error);
    } else if (error instanceof APIError) {
      this.handleAPIError(error);
    } else {
      this.handleUnknownError(error);
    }
  }
}
```

## 7. Testing Specifications

### 7.1 Unit Test Specifications
```typescript
describe('VisibilityScoreCalculator', () => {
  let calculator: VisibilityScoreCalculator;
  let mockData: AnalyticsInput;

  beforeEach(() => {
    calculator = new VisibilityScoreCalculator();
    mockData = createMockAnalyticsInput();
  });

  test('should calculate correct visibility score', () => {
    const result = calculator.calculate(mockData);
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(1);
  });
});
```

### 7.2 Integration Test Specifications
```typescript
describe('AnalyticsService Integration', () => {
  let service: AnalyticsService;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await TestDatabase.create();
    service = new AnalyticsService(database);
  });

  test('should process and store analytics data', async () => {
    const input = createTestAnalyticsData();
    await service.process(input);
    const stored = await database.getAnalytics(input.id);
    expect(stored).toMatchObject(input);
  });
});
```

## 8. Deployment Configuration

### 8.1 Docker Configuration
```dockerfile
# API Service
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 8.2 Kubernetes Configuration
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: analytics-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: analytics-api
  template:
    metadata:
      labels:
        app: analytics-api
    spec:
      containers:
      - name: analytics-api
        image: contently/analytics-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## 9. Monitoring Setup

### 9.1 Metrics Collection
```typescript
interface MetricsCollector {
  // System metrics
  collectSystemMetrics(): Promise<SystemMetrics>;
  
  // Business metrics
  collectBusinessMetrics(): Promise<BusinessMetrics>;
  
  // Custom metrics
  defineCustomMetric(definition: MetricDefinition): Promise<void>;
  collectCustomMetric(name: string): Promise<MetricValue>;
}
```

### 9.2 Alert Configuration
```typescript
interface AlertConfig {
  // Thresholds
  thresholds: {
    error_rate: number;
    latency_p95: number;
    cpu_usage: number;
    memory_usage: number;
  };
  
  // Notification channels
  notifications: {
    email: string[];
    slack: string;
    pagerduty: string;
  };
} 