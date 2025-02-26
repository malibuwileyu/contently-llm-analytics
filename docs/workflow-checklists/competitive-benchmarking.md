# Competitive Benchmarking Implementation Guide

## 1. Module Structure
```
src/modules/competitive-benchmarking/
├── __tests__/
│   ├── unit/
│   │   ├── competitive-benchmarking.service.spec.ts
│   │   └── competitor-analyzer.service.spec.ts
│   └── integration/
│       └── competitive-benchmarking.controller.spec.ts
├── controllers/
│   └── competitive-benchmarking.controller.ts
├── services/
│   ├── competitive-benchmarking.service.ts
│   ├── competitor-analyzer.service.ts
│   └── market-data-aggregator.service.ts
├── repositories/
│   └── competitor-analysis.repository.ts
├── entities/
│   ├── competitor-analysis.entity.ts
│   └── market-metric.entity.ts
├── dto/
│   ├── analyze-competitor.dto.ts
│   └── market-metric.dto.ts
├── interfaces/
│   ├── competitor-analysis.interface.ts
│   └── market-metric.interface.ts
├── runners/
│   └── competitive-benchmarking.runner.ts
└── competitive-benchmarking.module.ts
```

## 2. Core Components

### 2.1 Entity Definitions
```typescript
// src/modules/competitive-benchmarking/entities/competitor-analysis.entity.ts
@Entity()
export class CompetitorAnalysis extends BaseEntity {
  @Column()
  brandId: string;

  @Column()
  competitorId: string;

  @Column('jsonb')
  competitorData: {
    name: string;
    platform: string;
    category: string;
    region: string;
  };

  @Column('float')
  marketShare: number;

  @Column('float')
  sentimentScore: number;

  @Column('float')
  engagementRate: number;

  @Column('jsonb')
  metadata: {
    source: string;
    confidence: number;
    tags: string[];
  };

  @OneToMany(() => MarketMetric, metric => metric.analysis)
  metrics: MarketMetric[];

  @CreateDateColumn()
  analyzedAt: Date;
}

// src/modules/competitive-benchmarking/entities/market-metric.entity.ts
@Entity()
export class MarketMetric extends BaseEntity {
  @ManyToOne(() => CompetitorAnalysis)
  analysis: CompetitorAnalysis;

  @Column('text')
  type: 'market_share' | 'sentiment' | 'engagement' | 'content_quality';

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
// src/modules/competitive-benchmarking/repositories/competitor-analysis.repository.ts
@EntityRepository(CompetitorAnalysis)
export class CompetitorAnalysisRepository extends Repository<CompetitorAnalysis> {
  async findByBrandId(
    brandId: string,
    options: FindManyOptions<CompetitorAnalysis>
  ): Promise<CompetitorAnalysis[]> {
    return this.find({
      where: { brandId },
      ...options,
    });
  }

  async findWithMetrics(id: string): Promise<CompetitorAnalysis> {
    return this.createQueryBuilder('analysis')
      .leftJoinAndSelect('analysis.metrics', 'metrics')
      .where('analysis.id = :id', { id })
      .getOne();
  }

  async getMarketTrend(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MarketTrend[]> {
    return this.createQueryBuilder('analysis')
      .select('DATE(analysis.analyzedAt)', 'date')
      .addSelect('AVG(analysis.marketShare)', 'avgMarketShare')
      .addSelect('AVG(analysis.sentimentScore)', 'avgSentiment')
      .addSelect('AVG(analysis.engagementRate)', 'avgEngagement')
      .where('analysis.brandId = :brandId', { brandId })
      .andWhere('analysis.analyzedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(analysis.analyzedAt)')
      .orderBy('DATE(analysis.analyzedAt)', 'ASC')
      .getRawMany();
  }
}
```

### 2.3 Services Implementation

#### Competitor Analyzer Service
```typescript
// src/modules/competitive-benchmarking/services/competitor-analyzer.service.ts
@Injectable()
export class CompetitorAnalyzerService {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly cache: CacheService
  ) {}

  async analyzeCompetitor(
    competitorData: CompetitorData
  ): Promise<CompetitorAnalysis> {
    const cacheKey = `competitor:${createHash('md5')
      .update(JSON.stringify(competitorData))
      .digest('hex')}`;
    
    return this.cache.wrap(cacheKey, async () => {
      const analysis = await this.marketDataService.analyzeCompetitor(competitorData);
      return {
        marketShare: this.calculateMarketShare(analysis),
        sentiment: this.analyzeSentiment(analysis),
        engagement: this.analyzeEngagement(analysis),
        contentQuality: this.analyzeContentQuality(analysis),
      };
    });
  }

  private calculateMarketShare(analysis: MarketAnalysis): MarketShare {
    return {
      value: analysis.marketShare.value,
      trend: analysis.marketShare.trend,
      segments: analysis.marketShare.segments,
    };
  }

  private analyzeSentiment(analysis: MarketAnalysis): Sentiment {
    return {
      score: analysis.sentiment.score,
      distribution: analysis.sentiment.distribution,
      topics: analysis.sentiment.topics,
    };
  }

  private analyzeEngagement(analysis: MarketAnalysis): Engagement {
    return {
      rate: analysis.engagement.rate,
      metrics: {
        interactions: analysis.engagement.interactions,
        reach: analysis.engagement.reach,
        virality: analysis.engagement.virality,
      },
    };
  }

  private analyzeContentQuality(analysis: MarketAnalysis): ContentQuality {
    return {
      score: analysis.content.score,
      factors: analysis.content.factors,
      benchmarks: analysis.content.benchmarks,
    };
  }
}
```

#### Market Data Aggregator Service
```typescript
// src/modules/competitive-benchmarking/services/market-data-aggregator.service.ts
@Injectable()
export class MarketDataAggregatorService {
  constructor(
    @InjectRepository(MarketMetric)
    private readonly metricRepo: Repository<MarketMetric>
  ) {}

  async aggregateMetrics(
    analysis: CompetitorAnalysis,
    data: CompetitorAnalysis
  ): Promise<void> {
    await Promise.all([
      this.aggregateMarketShare(analysis, data.marketShare),
      this.aggregateSentiment(analysis, data.sentiment),
      this.aggregateEngagement(analysis, data.engagement),
      this.aggregateContentQuality(analysis, data.contentQuality),
    ]);
  }

  private async aggregateMarketShare(
    analysis: CompetitorAnalysis,
    marketShare: MarketShare
  ): Promise<void> {
    await this.metricRepo.save({
      analysis,
      type: 'market_share',
      category: 'overall',
      value: marketShare.value,
      details: {
        trend: marketShare.trend,
        segments: marketShare.segments,
      },
    });
  }

  private async aggregateSentiment(
    analysis: CompetitorAnalysis,
    sentiment: Sentiment
  ): Promise<void> {
    await this.metricRepo.save({
      analysis,
      type: 'sentiment',
      category: 'overall',
      value: sentiment.score,
      details: {
        distribution: sentiment.distribution,
        topics: sentiment.topics,
      },
    });
  }

  private async aggregateEngagement(
    analysis: CompetitorAnalysis,
    engagement: Engagement
  ): Promise<void> {
    await this.metricRepo.save({
      analysis,
      type: 'engagement',
      category: 'overall',
      value: engagement.rate,
      details: {
        metrics: engagement.metrics,
      },
    });
  }

  private async aggregateContentQuality(
    analysis: CompetitorAnalysis,
    contentQuality: ContentQuality
  ): Promise<void> {
    await this.metricRepo.save({
      analysis,
      type: 'content_quality',
      category: 'overall',
      value: contentQuality.score,
      details: {
        factors: contentQuality.factors,
        benchmarks: contentQuality.benchmarks,
      },
    });
  }
}
```

#### Competitive Benchmarking Service
```typescript
// src/modules/competitive-benchmarking/services/competitive-benchmarking.service.ts
@Injectable()
export class CompetitiveBenchmarkingService {
  constructor(
    private readonly analysisRepo: CompetitorAnalysisRepository,
    private readonly analyzer: CompetitorAnalyzerService,
    private readonly aggregator: MarketDataAggregatorService,
    private readonly metrics: MetricsService
  ) {}

  async analyzeCompetitor(
    data: AnalyzeCompetitorDto
  ): Promise<CompetitorAnalysis> {
    const startTime = Date.now();

    try {
      // Analyze competitor
      const analysis = await this.analyzer.analyzeCompetitor(data.competitorData);

      // Create analysis record
      const competitor = await this.analysisRepo.save({
        brandId: data.brandId,
        competitorId: data.competitorData.id,
        competitorData: data.competitorData,
        marketShare: analysis.marketShare.value,
        sentimentScore: analysis.sentiment.score,
        engagementRate: analysis.engagement.rate,
        metadata: data.metadata,
      });

      // Aggregate metrics
      await this.aggregator.aggregateMetrics(competitor, analysis);

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.analysisRepo.findWithMetrics(competitor.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  async getMarketInsights(
    brandId: string,
    options: InsightOptions
  ): Promise<MarketInsights> {
    const [analyses, trend] = await Promise.all([
      this.analysisRepo.findByBrandId(brandId, {
        order: { analyzedAt: 'DESC' },
        take: 100,
      }),
      this.analysisRepo.getMarketTrend(
        brandId,
        options.startDate,
        options.endDate
      ),
    ]);

    return {
      competitorRankings: this.calculateRankings(analyses),
      marketTrends: trend,
      opportunities: this.identifyOpportunities(analyses),
      threats: this.identifyThreats(analyses),
    };
  }

  private calculateRankings(
    analyses: CompetitorAnalysis[]
  ): CompetitorRanking[] {
    const rankings = analyses.map(analysis => ({
      competitorId: analysis.competitorId,
      name: analysis.competitorData.name,
      metrics: {
        marketShare: {
          value: analysis.marketShare,
          rank: 0,
        },
        sentiment: {
          value: analysis.sentimentScore,
          rank: 0,
        },
        engagement: {
          value: analysis.engagementRate,
          rank: 0,
        },
      },
    }));

    // Calculate ranks for each metric
    ['marketShare', 'sentiment', 'engagement'].forEach(metric => {
      rankings.sort(
        (a, b) => b.metrics[metric].value - a.metrics[metric].value
      );
      rankings.forEach((ranking, index) => {
        ranking.metrics[metric].rank = index + 1;
      });
    });

    return rankings;
  }

  private identifyOpportunities(
    analyses: CompetitorAnalysis[]
  ): Opportunity[] {
    return analyses
      .flatMap(analysis => analysis.metrics)
      .filter(metric => metric.value < this.getThreshold(metric.type))
      .map(metric => ({
        type: metric.type,
        competitorId: metric.analysis.competitorId,
        competitorName: metric.analysis.competitorData.name,
        gap: this.getThreshold(metric.type) - metric.value,
        recommendations: this.generateRecommendations(metric),
      }));
  }

  private identifyThreats(analyses: CompetitorAnalysis[]): Threat[] {
    return analyses
      .flatMap(analysis => analysis.metrics)
      .filter(metric => metric.value > this.getThreshold(metric.type))
      .map(metric => ({
        type: metric.type,
        competitorId: metric.analysis.competitorId,
        competitorName: metric.analysis.competitorData.name,
        advantage: metric.value - this.getThreshold(metric.type),
        mitigations: this.generateMitigations(metric),
      }));
  }

  private getThreshold(type: string): number {
    const thresholds: Record<string, number> = {
      market_share: 0.15,
      sentiment: 0.7,
      engagement: 0.1,
      content_quality: 0.8,
    };
    return thresholds[type];
  }

  private generateRecommendations(metric: MarketMetric): string[] {
    // Implementation based on metric type and details
    return [];
  }

  private generateMitigations(metric: MarketMetric): string[] {
    // Implementation based on metric type and details
    return [];
  }
}
```

### 2.4 Controller Implementation
```typescript
// src/modules/competitive-benchmarking/controllers/competitive-benchmarking.controller.ts
@Controller('competitive-benchmarking')
export class CompetitiveBenchmarkingController {
  constructor(
    private readonly competitiveBenchmarkingService: CompetitiveBenchmarkingService
  ) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeCompetitor(
    @Body() data: AnalyzeCompetitorDto
  ): Promise<CompetitorAnalysisDto> {
    const analysis = await this.competitiveBenchmarkingService.analyzeCompetitor(
      data
    );
    return this.transformToDto(analysis);
  }

  @Get('insights/:brandId')
  @UseGuards(JwtAuthGuard)
  async getMarketInsights(
    @Param('brandId') brandId: string,
    @Query() options: InsightOptionsDto
  ): Promise<MarketInsights> {
    return this.competitiveBenchmarkingService.getMarketInsights(
      brandId,
      options
    );
  }

  private transformToDto(analysis: CompetitorAnalysis): CompetitorAnalysisDto {
    return {
      id: analysis.id,
      brandId: analysis.brandId,
      competitorId: analysis.competitorId,
      competitorData: analysis.competitorData,
      marketShare: analysis.marketShare,
      sentimentScore: analysis.sentimentScore,
      engagementRate: analysis.engagementRate,
      metadata: analysis.metadata,
      metrics: analysis.metrics.map(metric => ({
        type: metric.type,
        category: metric.category,
        value: metric.value,
        details: metric.details,
      })),
      analyzedAt: analysis.analyzedAt,
    };
  }
}
```

### 2.5 Runner Implementation
```typescript
// src/modules/competitive-benchmarking/runners/competitive-benchmarking.runner.ts
@Injectable()
export class CompetitiveBenchmarkingRunner implements FeatureRunner {
  constructor(
    private readonly competitiveBenchmarkingService: CompetitiveBenchmarkingService,
    private readonly configService: ConfigService
  ) {}

  getName(): string {
    return 'competitive-benchmarking';
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get(
      'features.competitiveBenchmarking.enabled',
      true
    );
  }

  async run(context: FeatureContext): Promise<FeatureResult> {
    try {
      const analysis = await this.competitiveBenchmarkingService.analyzeCompetitor({
        brandId: context.brandId,
        competitorData: context.metadata?.competitorData as CompetitorData,
        metadata: context.metadata?.metadata as any,
      });

      const insights = await this.competitiveBenchmarkingService.getMarketInsights(
        context.brandId,
        {
          startDate: subDays(new Date(), 30),
          endDate: new Date(),
        }
      );

      return {
        success: true,
        data: {
          analysis,
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
// src/modules/competitive-benchmarking/competitive-benchmarking.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([CompetitorAnalysis, MarketMetric]),
    CacheModule.register(),
  ],
  controllers: [CompetitiveBenchmarkingController],
  providers: [
    CompetitiveBenchmarkingService,
    CompetitorAnalyzerService,
    MarketDataAggregatorService,
    CompetitiveBenchmarkingRunner,
    {
      provide: MarketDataService,
      useClass:
        process.env.NODE_ENV === 'test'
          ? MockMarketDataService
          : MarketDataService,
    },
  ],
  exports: [CompetitiveBenchmarkingRunner],
})
export class CompetitiveBenchmarkingModule {}
```

## 4. Testing Implementation

### 4.1 Service Tests
```typescript
// src/modules/competitive-benchmarking/__tests__/unit/competitive-benchmarking.service.spec.ts
describe('CompetitiveBenchmarkingService', () => {
  let service: CompetitiveBenchmarkingService;
  let analysisRepo: MockType<CompetitorAnalysisRepository>;
  let analyzer: MockType<CompetitorAnalyzerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetitiveBenchmarkingService,
        {
          provide: CompetitorAnalysisRepository,
          useFactory: createMock,
        },
        {
          provide: CompetitorAnalyzerService,
          useFactory: createMock,
        },
        {
          provide: MarketDataAggregatorService,
          useFactory: createMock,
        },
        {
          provide: MetricsService,
          useFactory: createMock,
        },
      ],
    }).compile();

    service = module.get<CompetitiveBenchmarkingService>(
      CompetitiveBenchmarkingService
    );
    analysisRepo = module.get(getRepositoryToken(CompetitorAnalysis));
    analyzer = module.get(CompetitorAnalyzerService);
  });

  describe('analyzeCompetitor', () => {
    it('should analyze competitor and save metrics', async () => {
      // Test implementation
    });

    it('should calculate market metrics correctly', async () => {
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
// src/modules/competitive-benchmarking/__tests__/integration/competitive-benchmarking.controller.spec.ts
describe('CompetitiveBenchmarking Integration', () => {
  let app: INestApplication;
  let analysisRepo: CompetitorAnalysisRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [CompetitiveBenchmarkingModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    analysisRepo = moduleFixture.get<CompetitorAnalysisRepository>(
      getRepositoryToken(CompetitorAnalysis)
    );
  });

  describe('POST /competitive-benchmarking/analyze', () => {
    it('should analyze competitor successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/competitive-benchmarking/analyze')
        .send({
          brandId: 'test-brand',
          competitorData: {
            id: 'test-competitor',
            name: 'Test Competitor',
            platform: 'test-platform',
            category: 'test-category',
            region: 'test-region',
          },
          metadata: {
            source: 'test-source',
            confidence: 0.9,
            tags: ['test'],
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        brandId: 'test-brand',
        competitorId: 'test-competitor',
        marketShare: expect.any(Number),
        sentimentScore: expect.any(Number),
        engagementRate: expect.any(Number),
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
// src/modules/competitive-benchmarking/migrations/1234567890-CreateCompetitiveBenchmarkingTables.ts
export class CreateCompetitiveBenchmarkingTables1234567890
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'competitor_analysis',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'brand_id',
            type: 'varchar',
          },
          {
            name: 'competitor_id',
            type: 'varchar',
          },
          {
            name: 'competitor_data',
            type: 'jsonb',
          },
          {
            name: 'market_share',
            type: 'float',
          },
          {
            name: 'sentiment_score',
            type: 'float',
          },
          {
            name: 'engagement_rate',
            type: 'float',
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
        name: 'market_metric',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'analysis_id',
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
            columnNames: ['analysis_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'competitor_analysis',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndices('competitor_analysis', [
      new TableIndex({
        name: 'IDX_competitor_analysis_brand_id',
        columnNames: ['brand_id'],
      }),
      new TableIndex({
        name: 'IDX_competitor_analysis_competitor_id',
        columnNames: ['competitor_id'],
      }),
      new TableIndex({
        name: 'IDX_competitor_analysis_analyzed_at',
        columnNames: ['analyzed_at'],
      }),
    ]);

    await queryRunner.createIndices('market_metric', [
      new TableIndex({
        name: 'IDX_market_metric_analysis_id',
        columnNames: ['analysis_id'],
      }),
      new TableIndex({
        name: 'IDX_market_metric_type',
        columnNames: ['type'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('market_metric');
    await queryRunner.dropTable('competitor_analysis');
  }
}
``` 