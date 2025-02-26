# Agent Analytics Implementation Guide

## 1. Module Structure
```
src/modules/agent-analytics/
├── __tests__/
│   ├── unit/
│   │   ├── agent-analytics.service.spec.ts
│   │   └── performance-analyzer.service.spec.ts
│   └── integration/
│       └── agent-analytics.controller.spec.ts
├── controllers/
│   └── agent-analytics.controller.ts
├── services/
│   ├── agent-analytics.service.ts
│   ├── performance-analyzer.service.ts
│   └── metrics-aggregator.service.ts
├── repositories/
│   └── agent-performance.repository.ts
├── entities/
│   ├── agent-performance.entity.ts
│   └── performance-metric.entity.ts
├── dto/
│   ├── analyze-performance.dto.ts
│   └── performance-metric.dto.ts
├── interfaces/
│   ├── performance-analysis.interface.ts
│   └── metric.interface.ts
├── runners/
│   └── agent-analytics.runner.ts
└── agent-analytics.module.ts
```

## 2. Core Components

### 2.1 Entity Definitions
```typescript
// src/modules/agent-analytics/entities/agent-performance.entity.ts
@Entity()
export class AgentPerformance extends BaseEntity {
  @Column()
  agentId: string;

  @Column()
  brandId: string;

  @Column('float')
  responseTime: number;

  @Column('float')
  accuracyScore: number;

  @Column('float')
  satisfactionScore: number;

  @Column('int')
  conversationCount: number;

  @Column('jsonb')
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  @OneToMany(() => PerformanceMetric, metric => metric.performance)
  metrics: PerformanceMetric[];

  @CreateDateColumn()
  analyzedAt: Date;
}

// src/modules/agent-analytics/entities/performance-metric.entity.ts
@Entity()
export class PerformanceMetric extends BaseEntity {
  @ManyToOne(() => AgentPerformance)
  performance: AgentPerformance;

  @Column('text')
  type: 'response_time' | 'accuracy' | 'satisfaction' | 'engagement';

  @Column('text')
  category: string;

  @Column('float')
  value: number;

  @Column('jsonb')
  details: Record<string, unknown>;
}
```

### 2.2 Repository Implementation
```typescript
// src/modules/agent-analytics/repositories/agent-performance.repository.ts
@EntityRepository(AgentPerformance)
export class AgentPerformanceRepository extends Repository<AgentPerformance> {
  async findByAgentId(
    agentId: string,
    options: FindManyOptions<AgentPerformance>
  ): Promise<AgentPerformance[]> {
    return this.find({
      where: { agentId },
      ...options,
    });
  }

  async findWithMetrics(id: string): Promise<AgentPerformance> {
    return this.createQueryBuilder('performance')
      .leftJoinAndSelect('performance.metrics', 'metrics')
      .where('performance.id = :id', { id })
      .getOne();
  }

  async getPerformanceTrend(
    agentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceTrend[]> {
    return this.createQueryBuilder('performance')
      .select('DATE(performance.analyzedAt)', 'date')
      .addSelect('AVG(performance.responseTime)', 'avgResponseTime')
      .addSelect('AVG(performance.accuracyScore)', 'avgAccuracy')
      .addSelect('AVG(performance.satisfactionScore)', 'avgSatisfaction')
      .where('performance.agentId = :agentId', { agentId })
      .andWhere('performance.analyzedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(performance.analyzedAt)')
      .orderBy('DATE(performance.analyzedAt)', 'ASC')
      .getRawMany();
  }
}
```

### 2.3 Services Implementation

#### Performance Analyzer Service
```typescript
// src/modules/agent-analytics/services/performance-analyzer.service.ts
@Injectable()
export class PerformanceAnalyzerService {
  constructor(
    private readonly nlpService: NLPService,
    private readonly cache: CacheService
  ) {}

  async analyzePerformance(
    conversations: Conversation[]
  ): Promise<PerformanceAnalysis> {
    const cacheKey = `performance:${createHash('md5')
      .update(JSON.stringify(conversations.map(c => c.id)))
      .digest('hex')}`;
    
    return this.cache.wrap(cacheKey, async () => {
      const analysis = await this.nlpService.analyzeAgentPerformance(conversations);
      return {
        responseTime: this.calculateResponseTime(conversations),
        accuracy: this.analyzeAccuracy(analysis),
        satisfaction: this.analyzeSatisfaction(analysis),
        engagement: this.analyzeEngagement(conversations, analysis),
      };
    });
  }

  private calculateResponseTime(conversations: Conversation[]): ResponseTime {
    const times = conversations.flatMap(conv =>
      conv.messages
        .filter(msg => msg.role === 'assistant')
        .map(msg => msg.timestamp.getTime() - conv.messages[0].timestamp.getTime())
    );

    return {
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      distribution: this.calculateDistribution(times),
    };
  }

  private analyzeAccuracy(analysis: NLPAnalysis): Accuracy {
    return {
      score: analysis.accuracy.score,
      factors: analysis.accuracy.factors,
      improvements: analysis.accuracy.suggestions,
    };
  }

  private analyzeSatisfaction(analysis: NLPAnalysis): Satisfaction {
    return {
      score: analysis.satisfaction.score,
      aspects: analysis.satisfaction.aspects,
      trends: analysis.satisfaction.trends,
    };
  }

  private analyzeEngagement(
    conversations: Conversation[],
    analysis: NLPAnalysis
  ): Engagement {
    return {
      score: analysis.engagement.score,
      metrics: {
        messageCount: this.calculateMessageMetrics(conversations),
        interactionDepth: analysis.engagement.depth,
        followUpRate: analysis.engagement.followUp,
      },
    };
  }

  private calculateMessageMetrics(conversations: Conversation[]): MessageMetrics {
    const counts = conversations.map(conv => conv.messages.length);
    return {
      average: counts.reduce((sum, count) => sum + count, 0) / counts.length,
      distribution: this.calculateDistribution(counts),
    };
  }

  private calculateDistribution(values: number[]): Distribution {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }
}
```

#### Metrics Aggregator Service
```typescript
// src/modules/agent-analytics/services/metrics-aggregator.service.ts
@Injectable()
export class MetricsAggregatorService {
  constructor(
    @InjectRepository(PerformanceMetric)
    private readonly metricRepo: Repository<PerformanceMetric>
  ) {}

  async aggregateMetrics(
    performance: AgentPerformance,
    analysis: PerformanceAnalysis
  ): Promise<void> {
    await Promise.all([
      this.aggregateResponseTime(performance, analysis.responseTime),
      this.aggregateAccuracy(performance, analysis.accuracy),
      this.aggregateSatisfaction(performance, analysis.satisfaction),
      this.aggregateEngagement(performance, analysis.engagement),
    ]);
  }

  private async aggregateResponseTime(
    performance: AgentPerformance,
    responseTime: ResponseTime
  ): Promise<void> {
    await this.metricRepo.save({
      performance,
      type: 'response_time',
      category: 'average',
      value: responseTime.average,
      details: {
        distribution: responseTime.distribution,
      },
    });
  }

  private async aggregateAccuracy(
    performance: AgentPerformance,
    accuracy: Accuracy
  ): Promise<void> {
    await this.metricRepo.save({
      performance,
      type: 'accuracy',
      category: 'overall',
      value: accuracy.score,
      details: {
        factors: accuracy.factors,
        improvements: accuracy.improvements,
      },
    });
  }

  private async aggregateSatisfaction(
    performance: AgentPerformance,
    satisfaction: Satisfaction
  ): Promise<void> {
    await this.metricRepo.save({
      performance,
      type: 'satisfaction',
      category: 'overall',
      value: satisfaction.score,
      details: {
        aspects: satisfaction.aspects,
        trends: satisfaction.trends,
      },
    });
  }

  private async aggregateEngagement(
    performance: AgentPerformance,
    engagement: Engagement
  ): Promise<void> {
    await this.metricRepo.save({
      performance,
      type: 'engagement',
      category: 'overall',
      value: engagement.score,
      details: {
        metrics: engagement.metrics,
      },
    });
  }
}
```

#### Agent Analytics Service
```typescript
// src/modules/agent-analytics/services/agent-analytics.service.ts
@Injectable()
export class AgentAnalyticsService {
  constructor(
    private readonly performanceRepo: AgentPerformanceRepository,
    private readonly analyzer: PerformanceAnalyzerService,
    private readonly aggregator: MetricsAggregatorService,
    private readonly metrics: MetricsService
  ) {}

  async analyzePerformance(
    data: AnalyzePerformanceDto
  ): Promise<AgentPerformance> {
    const startTime = Date.now();

    try {
      // Analyze performance
      const analysis = await this.analyzer.analyzePerformance(data.conversations);

      // Create performance record
      const performance = await this.performanceRepo.save({
        agentId: data.agentId,
        brandId: data.brandId,
        responseTime: analysis.responseTime.average,
        accuracyScore: analysis.accuracy.score,
        satisfactionScore: analysis.satisfaction.score,
        conversationCount: data.conversations.length,
        metadata: data.metadata,
      });

      // Aggregate metrics
      await this.aggregator.aggregateMetrics(performance, analysis);

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.performanceRepo.findWithMetrics(performance.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  async getPerformanceInsights(
    agentId: string,
    options: InsightOptions
  ): Promise<PerformanceInsights> {
    const [performances, trend] = await Promise.all([
      this.performanceRepo.findByAgentId(agentId, {
        order: { analyzedAt: 'DESC' },
        take: 100,
      }),
      this.performanceRepo.getPerformanceTrend(
        agentId,
        options.startDate,
        options.endDate
      ),
    ]);

    return {
      currentPerformance: this.calculateCurrentPerformance(performances[0]),
      historicalTrend: trend,
      improvements: this.generateImprovements(performances),
      benchmarks: await this.calculateBenchmarks(performances[0].brandId),
    };
  }

  private calculateCurrentPerformance(
    performance: AgentPerformance
  ): CurrentPerformance {
    return {
      responseTime: {
        value: performance.responseTime,
        status: this.getMetricStatus(performance.responseTime, 'response_time'),
      },
      accuracy: {
        value: performance.accuracyScore,
        status: this.getMetricStatus(performance.accuracyScore, 'accuracy'),
      },
      satisfaction: {
        value: performance.satisfactionScore,
        status: this.getMetricStatus(
          performance.satisfactionScore,
          'satisfaction'
        ),
      },
    };
  }

  private getMetricStatus(value: number, type: string): MetricStatus {
    const thresholds = this.getThresholds(type);
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.fair) return 'fair';
    return 'needs_improvement';
  }

  private getThresholds(type: string): Thresholds {
    const thresholds: Record<string, Thresholds> = {
      response_time: { excellent: 30, good: 60, fair: 120 },
      accuracy: { excellent: 0.9, good: 0.8, fair: 0.7 },
      satisfaction: { excellent: 0.9, good: 0.8, fair: 0.7 },
    };
    return thresholds[type];
  }

  private generateImprovements(
    performances: AgentPerformance[]
  ): Improvement[] {
    const metrics = performances.flatMap(p => p.metrics);
    return metrics
      .filter(m => m.value < this.getThresholds(m.type).good)
      .map(m => ({
        metric: m.type,
        current: m.value,
        target: this.getThresholds(m.type).good,
        suggestions: m.details.improvements || [],
      }));
  }

  private async calculateBenchmarks(
    brandId: string
  ): Promise<PerformanceBenchmarks> {
    const performances = await this.performanceRepo.find({
      where: { brandId },
      order: { analyzedAt: 'DESC' },
      take: 1000,
    });

    const metrics = performances.reduce(
      (acc, p) => {
        acc.responseTime.push(p.responseTime);
        acc.accuracy.push(p.accuracyScore);
        acc.satisfaction.push(p.satisfactionScore);
        return acc;
      },
      {
        responseTime: [] as number[],
        accuracy: [] as number[],
        satisfaction: [] as number[],
      }
    );

    return {
      responseTime: this.calculateMetricBenchmarks(metrics.responseTime),
      accuracy: this.calculateMetricBenchmarks(metrics.accuracy),
      satisfaction: this.calculateMetricBenchmarks(metrics.satisfaction),
    };
  }

  private calculateMetricBenchmarks(values: number[]): MetricBenchmarks {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      percentiles: {
        p25: sorted[Math.floor(sorted.length * 0.25)],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p75: sorted[Math.floor(sorted.length * 0.75)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
      },
    };
  }
}
```

### 2.4 Controller Implementation
```typescript
// src/modules/agent-analytics/controllers/agent-analytics.controller.ts
@Controller('agent-analytics')
export class AgentAnalyticsController {
  constructor(
    private readonly agentAnalyticsService: AgentAnalyticsService
  ) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzePerformance(
    @Body() data: AnalyzePerformanceDto
  ): Promise<AgentPerformanceDto> {
    const performance = await this.agentAnalyticsService.analyzePerformance(
      data
    );
    return this.transformToDto(performance);
  }

  @Get('insights/:agentId')
  @UseGuards(JwtAuthGuard)
  async getPerformanceInsights(
    @Param('agentId') agentId: string,
    @Query() options: InsightOptionsDto
  ): Promise<PerformanceInsights> {
    return this.agentAnalyticsService.getPerformanceInsights(agentId, options);
  }

  private transformToDto(performance: AgentPerformance): AgentPerformanceDto {
    return {
      id: performance.id,
      agentId: performance.agentId,
      brandId: performance.brandId,
      responseTime: performance.responseTime,
      accuracyScore: performance.accuracyScore,
      satisfactionScore: performance.satisfactionScore,
      conversationCount: performance.conversationCount,
      metadata: performance.metadata,
      metrics: performance.metrics.map(metric => ({
        type: metric.type,
        category: metric.category,
        value: metric.value,
        details: metric.details,
      })),
      analyzedAt: performance.analyzedAt,
    };
  }
}
```

### 2.5 Runner Implementation
```typescript
// src/modules/agent-analytics/runners/agent-analytics.runner.ts
@Injectable()
export class AgentAnalyticsRunner implements FeatureRunner {
  constructor(
    private readonly agentAnalyticsService: AgentAnalyticsService,
    private readonly configService: ConfigService
  ) {}

  getName(): string {
    return 'agent-analytics';
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get('features.agentAnalytics.enabled', true);
  }

  async run(context: FeatureContext): Promise<FeatureResult> {
    try {
      const performance = await this.agentAnalyticsService.analyzePerformance({
        agentId: context.metadata?.agentId as string,
        brandId: context.brandId,
        conversations: context.metadata?.conversations as Conversation[],
        metadata: context.metadata?.metadata as any,
      });

      const insights = await this.agentAnalyticsService.getPerformanceInsights(
        performance.agentId,
        {
          startDate: subDays(new Date(), 30),
          endDate: new Date(),
        }
      );

      return {
        success: true,
        data: {
          performance,
          insights,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
      };
    }
  }
}
```

## 3. Module Configuration
```typescript
// src/modules/agent-analytics/agent-analytics.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([AgentPerformance, PerformanceMetric]),
    CacheModule.register(),
  ],
  controllers: [AgentAnalyticsController],
  providers: [
    AgentAnalyticsService,
    PerformanceAnalyzerService,
    MetricsAggregatorService,
    AgentAnalyticsRunner,
    {
      provide: NLPService,
      useClass: process.env.NODE_ENV === 'test' ? MockNLPService : NLPService,
    },
  ],
  exports: [AgentAnalyticsRunner],
})
export class AgentAnalyticsModule {}
```

## 4. Testing Implementation

### 4.1 Service Tests
```typescript
// src/modules/agent-analytics/__tests__/unit/agent-analytics.service.spec.ts
describe('AgentAnalyticsService', () => {
  let service: AgentAnalyticsService;
  let performanceRepo: MockType<AgentPerformanceRepository>;
  let analyzer: MockType<PerformanceAnalyzerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentAnalyticsService,
        {
          provide: AgentPerformanceRepository,
          useFactory: createMock,
        },
        {
          provide: PerformanceAnalyzerService,
          useFactory: createMock,
        },
        {
          provide: MetricsAggregatorService,
          useFactory: createMock,
        },
        {
          provide: MetricsService,
          useFactory: createMock,
        },
      ],
    }).compile();

    service = module.get<AgentAnalyticsService>(AgentAnalyticsService);
    performanceRepo = module.get(getRepositoryToken(AgentPerformance));
    analyzer = module.get(PerformanceAnalyzerService);
  });

  describe('analyzePerformance', () => {
    it('should analyze performance and save metrics', async () => {
      // Test implementation
    });

    it('should calculate performance scores correctly', async () => {
      // Test implementation
    });

    it('should handle analysis errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

### 4.2 Integration Tests
```typescript
// src/modules/agent-analytics/__tests__/integration/agent-analytics.controller.spec.ts
describe('AgentAnalytics Integration', () => {
  let app: INestApplication;
  let performanceRepo: AgentPerformanceRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AgentAnalyticsModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    performanceRepo = moduleFixture.get<AgentPerformanceRepository>(
      getRepositoryToken(AgentPerformance)
    );
  });

  describe('POST /agent-analytics/analyze', () => {
    it('should analyze agent performance successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/agent-analytics/analyze')
        .send({
          agentId: 'test-agent',
          brandId: 'test-brand',
          conversations: [
            {
              id: 'test-conversation',
              messages: [
                {
                  role: 'user',
                  content: 'Test message',
                  timestamp: new Date(),
                },
              ],
            },
          ],
          metadata: {
            platform: 'test-platform',
            context: 'test context',
            tags: ['test'],
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        agentId: 'test-agent',
        brandId: 'test-brand',
        responseTime: expect.any(Number),
        accuracyScore: expect.any(Number),
        satisfactionScore: expect.any(Number),
        metrics: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            value: expect.any(Number),
          }),
        ]),
      });
    });
  });
});
```

## 5. Migration Script
```typescript
// src/modules/agent-analytics/migrations/1234567890-CreateAgentAnalyticsTables.ts
export class CreateAgentAnalyticsTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'agent_performance',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agent_id',
            type: 'varchar',
          },
          {
            name: 'brand_id',
            type: 'varchar',
          },
          {
            name: 'response_time',
            type: 'float',
          },
          {
            name: 'accuracy_score',
            type: 'float',
          },
          {
            name: 'satisfaction_score',
            type: 'float',
          },
          {
            name: 'conversation_count',
            type: 'integer',
          },
          {
            name: 'metadata',
            type: 'jsonb',
          },
          {
            name: 'analyzed_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createTable(
      new Table({
        name: 'performance_metric',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'performance_id',
            type: 'uuid',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'category',
            type: 'varchar',
          },
          {
            name: 'value',
            type: 'float',
          },
          {
            name: 'details',
            type: 'jsonb',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['performance_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'agent_performance',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndices('agent_performance', [
      new TableIndex({
        name: 'IDX_agent_performance_agent_id',
        columnNames: ['agent_id'],
      }),
      new TableIndex({
        name: 'IDX_agent_performance_brand_id',
        columnNames: ['brand_id'],
      }),
      new TableIndex({
        name: 'IDX_agent_performance_analyzed_at',
        columnNames: ['analyzed_at'],
      }),
    ]);

    await queryRunner.createIndices('performance_metric', [
      new TableIndex({
        name: 'IDX_performance_metric_performance_id',
        columnNames: ['performance_id'],
      }),
      new TableIndex({
        name: 'IDX_performance_metric_type',
        columnNames: ['type'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('performance_metric');
    await queryRunner.dropTable('agent_performance');
  }
}
```

### 3.3 Agent Analytics
- [ ] Implement AI bot detection
  - [ ] Create detection algorithm
  - [ ] Set up detection result caching (TTL: 5 minutes)
  - [ ] Add cache invalidation on new detections
- [ ] Create crawl pattern analyzer
  - [ ] Implement pattern analysis
  - [ ] Configure pattern caching (TTL: 30 minutes)
  - [ ] Set up scheduled cache updates
- [ ] Build indexing monitoring system
  - [ ] Create monitoring service
  - [ ] Set up monitoring cache (TTL: 15 minutes)
  - [ ] Implement cache refresh strategy
- [ ] Create optimization suggestion engine
  - [ ] Implement suggestion algorithm
  - [ ] Configure suggestion caching (TTL: 1 hour)
  - [ ] Add cache invalidation on updates
- [ ] Implement schema validation system
  - [ ] Create validation service
  - [ ] Set up validation cache (TTL: 30 minutes)
  - [ ] Configure cache invalidation rules 