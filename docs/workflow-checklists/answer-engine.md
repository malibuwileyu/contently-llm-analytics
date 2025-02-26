# Answer Engine Implementation Guide

## 1. Module Structure
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
```typescript
// src/modules/answer-engine/controllers/answer-engine.controller.ts
@Controller('answer-engine')
export class AnswerEngineController {
  constructor(private readonly answerEngineService: AnswerEngineService) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeContent(
    @Body() data: AnalyzeContentDto
  ): Promise<BrandMentionDto> {
    const mention = await this.answerEngineService.analyzeMention(data);
    return this.transformToDto(mention);
  }

  @Get('brand-health/:brandId')
  @UseGuards(JwtAuthGuard)
  async getBrandHealth(
    @Param('brandId') brandId: string
  ): Promise<BrandHealth> {
    return this.answerEngineService.getBrandHealth(brandId);
  }

  private transformToDto(mention: BrandMention): BrandMentionDto {
    return {
      id: mention.id,
      brandId: mention.brandId,
      content: mention.content,
      sentiment: mention.sentiment,
      context: mention.context,
      citations: mention.citations.map(citation => ({
        source: citation.source,
        authority: citation.authority,
        metadata: citation.metadata,
      })),
      mentionedAt: mention.mentionedAt,
    };
  }
}
```

### 2.5 Runner Implementation
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
```typescript
// src/modules/answer-engine/answer-engine.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([BrandMention, Citation]),
    CacheModule.register(),
  ],
  controllers: [AnswerEngineController],
  providers: [
    AnswerEngineService,
    SentimentAnalyzerService,
    CitationTrackerService,
    AnswerEngineRunner,
    {
      provide: NLPService,
      useClass: process.env.NODE_ENV === 'test' ? MockNLPService : NLPService,
    },
  ],
  exports: [AnswerEngineRunner],
})
export class AnswerEngineModule {}
```

## 4. Testing Implementation

### 4.1 Service Tests
```typescript
// src/modules/answer-engine/__tests__/unit/answer-engine.service.spec.ts
describe('AnswerEngineService', () => {
  let service: AnswerEngineService;
  let brandMentionRepo: MockType<BrandMentionRepository>;
  let sentimentAnalyzer: MockType<SentimentAnalyzerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnswerEngineService,
        {
          provide: BrandMentionRepository,
          useFactory: createMock,
        },
        {
          provide: SentimentAnalyzerService,
          useFactory: createMock,
        },
        {
          provide: CitationTrackerService,
          useFactory: createMock,
        },
        {
          provide: MetricsService,
          useFactory: createMock,
        },
      ],
    }).compile();

    service = module.get<AnswerEngineService>(AnswerEngineService);
    brandMentionRepo = module.get(getRepositoryToken(BrandMention));
    sentimentAnalyzer = module.get(SentimentAnalyzerService);
  });

  describe('analyzeMention', () => {
    it('should analyze content and save brand mention', async () => {
      // Test implementation
    });

    it('should handle citations correctly', async () => {
      // Test implementation
    });

    it('should record metrics', async () => {
      // Test implementation
    });
  });
});
```

### 4.2 Integration Tests
```typescript
// src/modules/answer-engine/__tests__/integration/answer-engine.controller.spec.ts
describe('AnswerEngine Integration', () => {
  let app: INestApplication;
  let brandMentionRepo: BrandMentionRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AnswerEngineModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    brandMentionRepo = moduleFixture.get<BrandMentionRepository>(
      getRepositoryToken(BrandMention)
    );
  });

  describe('POST /answer-engine/analyze', () => {
    it('should analyze content successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/answer-engine/analyze')
        .send({
          brandId: 'test-brand',
          content: 'Test content for analysis',
          context: {
            query: 'test query',
            response: 'test response',
            platform: 'test-platform',
          },
        })
        .expect(201);

      expect(response.body).toMatchObject({
        brandId: 'test-brand',
        content: 'Test content for analysis',
        sentiment: expect.any(Number),
      });
    });
  });
});
```

## 5. Migration Script
```typescript
// src/modules/answer-engine/migrations/1234567890-CreateAnswerEngineTables.ts
export class CreateAnswerEngineTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'brand_mention',
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
            name: 'content',
            type: 'text',
          },
          {
            name: 'sentiment',
            type: 'float',
          },
          {
            name: 'context',
            type: 'jsonb',
          },
          {
            name: 'mentioned_at',
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
        name: 'citation',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'brand_mention_id',
            type: 'uuid',
          },
          {
            name: 'source',
            type: 'text',
          },
          {
            name: 'authority',
            type: 'float',
          },
          {
            name: 'metadata',
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
            columnNames: ['brand_mention_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'brand_mention',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndices('brand_mention', [
      new TableIndex({
        name: 'IDX_brand_mention_brand_id',
        columnNames: ['brand_id'],
      }),
      new TableIndex({
        name: 'IDX_brand_mention_mentioned_at',
        columnNames: ['mentioned_at'],
      }),
    ]);

    await queryRunner.createIndices('citation', [
      new TableIndex({
        name: 'IDX_citation_brand_mention_id',
        columnNames: ['brand_mention_id'],
      }),
      new TableIndex({
        name: 'IDX_citation_authority',
        columnNames: ['authority'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('citation');
    await queryRunner.dropTable('brand_mention');
  }
}
```

### 3.1 Answer Engine Insights
- [ ] Create brand mention tracking system
  - [ ] Implement brand mention detection
  - [ ] Set up mention caching (TTL: 30 minutes)
  - [ ] Add cache invalidation on new mentions
- [ ] Implement sentiment analysis integration
  - [ ] Set up sentiment analysis service
  - [ ] Configure analysis result caching (TTL: 1 hour)
  - [ ] Add cache invalidation on sentiment updates
- [ ] Build citation tracking system
  - [ ] Implement citation detection
  - [ ] Set up citation caching (TTL: 1 hour)
  - [ ] Configure cache invalidation patterns
- [ ] Create brand health score calculator
  - [ ] Implement health score computation
  - [ ] Set up score caching (TTL: 2 hours)
  - [ ] Add metric-based cache invalidation
- [ ] Implement real-time monitoring system
  - [ ] Set up monitoring service
  - [ ] Configure short-lived cache for real-time data
  - [ ] Implement cache update streaming 