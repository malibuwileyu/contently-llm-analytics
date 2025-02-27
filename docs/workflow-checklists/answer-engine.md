# Answer Engine Implementation Checklist

## 1. Module Structure
- [x] Create basic module structure
```
src/modules/answer-engine/
├── __tests__/
│   ├── unit/
│   │   ├── answer-engine.service.spec.ts
│   │   └── sentiment-analyzer.service.spec.ts
│   └── integration/
│       └── answer-engine.controller.spec.ts
├── controllers/
│   └── answer-engine.controller.ts
├── services/
│   ├── answer-engine.service.ts
│   ├── sentiment-analyzer.service.ts
│   └── citation-tracker.service.ts
├── repositories/
│   └── brand-mention.repository.ts
├── entities/
│   ├── brand-mention.entity.ts
│   └── citation.entity.ts
├── dto/
│   ├── analyze-content.dto.ts
│   └── brand-mention.dto.ts
├── interfaces/
│   ├── sentiment-analysis.interface.ts
│   └── citation.interface.ts
├── runners/
│   └── answer-engine.runner.ts
└── answer-engine.module.ts
```

## 2. Core Components

### 2.1 Entity Definitions
- [x] Implement BrandMention entity
```typescript
// src/modules/answer-engine/entities/brand-mention.entity.ts
@Entity()
export class BrandMention extends BaseEntity {
  @Column()
  brandId: string;

  @Column('text')
  content: string;

  @Column('float')
  sentiment: number;

  @Column('jsonb')
  context: {
    query: string;
    response: string;
    platform: string;
  };

  @OneToMany(() => Citation, citation => citation.brandMention)
  citations: Citation[];

  @CreateDateColumn()
  mentionedAt: Date;
}
```

- [x] Implement Citation entity
```typescript
// src/modules/answer-engine/entities/citation.entity.ts
@Entity()
export class Citation extends BaseEntity {
  @ManyToOne(() => BrandMention)
  brandMention: BrandMention;

  @Column('text')
  source: string;

  @Column('float')
  authority: number;

  @Column('jsonb')
  metadata: Record<string, unknown>;
}
```

### 2.2 Repository Implementation
- [x] Implement BrandMentionRepository
```typescript
// src/modules/answer-engine/repositories/brand-mention.repository.ts
@EntityRepository(BrandMention)
export class BrandMentionRepository extends Repository<BrandMention> {
  async findByBrandId(
    brandId: string,
    options: FindManyOptions<BrandMention>
  ): Promise<BrandMention[]> {
    return this.find({
      where: { brandId },
      ...options,
    });
  }

  async findWithCitations(id: string): Promise<BrandMention> {
    return this.createQueryBuilder('mention')
      .leftJoinAndSelect('mention.citations', 'citations')
      .where('mention.id = :id', { id })
      .getOne();
  }

  async getSentimentTrend(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SentimentTrend[]> {
    return this.createQueryBuilder('mention')
      .select('DATE(mention.mentionedAt)', 'date')
      .addSelect('AVG(mention.sentiment)', 'averageSentiment')
      .where('mention.brandId = :brandId', { brandId })
      .andWhere('mention.mentionedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(mention.mentionedAt)')
      .orderBy('DATE(mention.mentionedAt)', 'ASC')
      .getRawMany();
  }
}
```

### 2.3 Services Implementation

#### Sentiment Analyzer Service
- [x] Implement SentimentAnalyzerService
```typescript
// src/modules/answer-engine/services/sentiment-analyzer.service.ts
@Injectable()
export class SentimentAnalyzerService {
  constructor(
    private readonly nlpService: NLPService,
    private readonly cache: CacheService
  ) {}

  async analyzeSentiment(content: string): Promise<SentimentAnalysis> {
    const cacheKey = `sentiment:${createHash('md5').update(content).digest('hex')}`;
    
    return this.cache.wrap(cacheKey, async () => {
      const analysis = await this.nlpService.analyzeSentiment(content);
      return {
        score: analysis.score,
        magnitude: analysis.magnitude,
        aspects: analysis.aspects,
      };
    });
  }
}
```

#### Citation Tracker Service
- [x] Implement CitationTrackerService
```typescript
// src/modules/answer-engine/services/citation-tracker.service.ts
@Injectable()
export class CitationTrackerService {
  constructor(
    @InjectRepository(Citation)
    private readonly citationRepo: Repository<Citation>,
    private readonly authorityCalculator: AuthorityCalculatorService
  ) {}

  async trackCitation(citation: CreateCitationDto): Promise<Citation> {
    const authority = await this.authorityCalculator.calculateAuthority(
      citation.source
    );

    const newCitation = this.citationRepo.create({
      ...citation,
      authority,
    });

    return this.citationRepo.save(newCitation);
  }
}
```

#### Answer Engine Service
- [x] Implement AnswerEngineService
```typescript
// src/modules/answer-engine/services/answer-engine.service.ts
@Injectable()
export class AnswerEngineService {
  constructor(
    private readonly brandMentionRepo: BrandMentionRepository,
    private readonly sentimentAnalyzer: SentimentAnalyzerService,
    private readonly citationTracker: CitationTrackerService,
    private readonly metrics: MetricsService
  ) {}

  async analyzeMention(data: AnalyzeContentDto): Promise<BrandMention> {
    const startTime = Date.now();

    try {
      // Analyze sentiment
      const sentiment = await this.sentimentAnalyzer.analyzeSentiment(data.content);

      // Create brand mention
      const mention = await this.brandMentionRepo.save({
        brandId: data.brandId,
        content: data.content,
        sentiment: sentiment.score,
        context: data.context,
      });

      // Track citations
      if (data.citations?.length) {
        await Promise.all(
          data.citations.map(citation =>
            this.citationTracker.trackCitation({
              ...citation,
              brandMention: mention,
            })
          )
        );
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.brandMentionRepo.findWithCitations(mention.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  async getBrandHealth(brandId: string): Promise<BrandHealth> {
    const [mentions, sentimentTrend] = await Promise.all([
      this.brandMentionRepo.findByBrandId(brandId, {
        order: { mentionedAt: 'DESC' },
        take: 100,
      }),
      this.brandMentionRepo.getSentimentTrend(
        brandId,
        subDays(new Date(), 30),
        new Date()
      ),
    ]);

    return {
      overallSentiment: this.calculateOverallSentiment(mentions),
      trend: sentimentTrend,
      mentionCount: mentions.length,
      topCitations: this.getTopCitations(mentions),
    };
  }

  private calculateOverallSentiment(mentions: BrandMention[]): number {
    if (!mentions.length) return 0;
    return mentions.reduce((sum, mention) => sum + mention.sentiment, 0) / mentions.length;
  }

  private getTopCitations(mentions: BrandMention[]): Citation[] {
    return mentions
      .flatMap(mention => mention.citations)
      .sort((a, b) => b.authority - a.authority)
      .slice(0, 10);
  }
}
```

### 2.4 Controller Implementation
- [x] Implement GraphQL resolver
```typescript
// src/modules/answer-engine/graphql/answer.resolver.ts
@Resolver()
export class AnswerResolver {
  constructor(
    @Inject('PUB_SUB') private readonly pubSub: PubSub,
    private readonly answerEngineService: AnswerEngineService
  ) {}

  // Implementation details...
}
```

### 2.5 Runner Implementation
- [x] Implement AnswerEngineRunner
```typescript
// src/modules/answer-engine/runners/answer-engine.runner.ts
@Injectable()
export class AnswerEngineRunner implements FeatureRunner {
  constructor(
    private readonly answerEngineService: AnswerEngineService,
    private readonly configService: ConfigService
  ) {}

  getName(): string {
    return 'answer-engine';
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get('features.answerEngine.enabled', true);
  }

  async run(context: FeatureContext): Promise<FeatureResult> {
    try {
      const mention = await this.answerEngineService.analyzeMention({
        brandId: context.brandId,
        content: context.metadata?.content as string,
        context: context.metadata?.context as any,
        citations: context.metadata?.citations as any[],
      });

      const health = await this.answerEngineService.getBrandHealth(context.brandId);

      return {
        success: true,
        data: {
          mention,
          health,
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
- [x] Configure AnswerEngineModule
```typescript
// src/modules/answer-engine/answer-engine.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([
      BrandMention,
      Citation
    ])
  ],
  providers: [
    // Repositories
    BrandMentionRepository,
    
    // Services
    SentimentAnalyzerService,
    CitationTrackerService,
    AnswerEngineService,
    
    // GraphQL Resolver
    AnswerResolver,
    
    // WebSocket Gateway
    AnalyticsGateway,
    
    // Runner
    AnswerEngineRunner,
    
    // NLP Service implementation
    NLPService,
    {
      provide: 'NLPService',
      useExisting: NLPService
    },
    
    // Authority Calculator implementation
    AuthorityCalculatorService,
    {
      provide: 'AuthorityCalculatorService',
      useExisting: AuthorityCalculatorService
    },
    
    // Metrics Service implementation
    {
      provide: 'MetricsService',
      useExisting: PrometheusMetricsService
    },
    
    // PubSub for GraphQL subscriptions
    {
      provide: 'PUB_SUB',
      useFactory: () => {
        const { PubSub } = require('graphql-subscriptions');
        return new PubSub();
      }
    }
  ],
  exports: [
    AnswerEngineService,
    AnswerEngineRunner
  ]
})
export class AnswerEngineModule {}
```

## 4. Testing Implementation

### 4.1 Service Tests
- [x] Implement AnswerEngineService tests
- [x] Implement SentimentAnalyzerService tests
- [x] Implement CitationTrackerService tests
- [x] Implement NLPService tests
- [x] Implement AuthorityCalculatorService tests

### 4.2 Integration Tests
- [x] Implement AnswerEngine integration tests
- [x] Implement AnswerResolver integration tests

## 5. Migration Script
- [x] Implement migration script for database tables

## 6. Additional Features

### 6.1 Answer Engine Insights
- [x] Create brand mention tracking system
  - [x] Implement brand mention detection
  - [x] Set up mention caching (TTL: 30 minutes)
  - [ ] Add cache invalidation on new mentions
- [x] Implement sentiment analysis integration
  - [x] Set up sentiment analysis service
  - [x] Configure analysis result caching (TTL: 1 hour)
  - [ ] Add cache invalidation on sentiment updates
- [x] Build citation tracking system
  - [x] Implement citation detection
  - [x] Set up citation caching (TTL: 1 hour)
  - [ ] Configure cache invalidation patterns
- [x] Create brand health score calculator
  - [x] Implement health score computation
  - [ ] Set up score caching (TTL: 2 hours)
  - [ ] Add metric-based cache invalidation
- [x] Implement real-time monitoring system
  - [x] Set up monitoring service
  - [ ] Configure short-lived cache for real-time data
  - [x] Implement cache update streaming

### 6.2 GraphQL Integration
- [x] Implement GraphQL resolver for Answer Engine
- [x] Add GraphQL subscriptions for real-time updates
- [x] Create GraphQL types for Answer Engine entities

### 6.3 NLP Service Implementation
- [x] Implement NLPService for sentiment analysis
- [x] Add aspect-based sentiment analysis
- [x] Implement caching for NLP results

### 6.4 Authority Calculator
- [x] Implement AuthorityCalculatorService
- [x] Add domain-based authority scoring
- [x] Implement caching for authority scores 