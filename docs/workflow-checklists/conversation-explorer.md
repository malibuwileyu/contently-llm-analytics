# Conversation Explorer Implementation Guide

## 1. Module Structure
```
src/modules/conversation-explorer/
├── __tests__/
│   ├── unit/
│   │   ├── conversation-explorer.service.spec.ts
│   │   └── conversation-analyzer.service.spec.ts
│   └── integration/
│       └── conversation-explorer.controller.spec.ts
├── controllers/
│   └── conversation-explorer.controller.ts
├── services/
│   ├── conversation-explorer.service.ts
│   ├── conversation-analyzer.service.ts
│   └── conversation-indexer.service.ts
├── repositories/
│   └── conversation.repository.ts
├── entities/
│   ├── conversation.entity.ts
│   └── conversation-insight.entity.ts
├── dto/
│   ├── analyze-conversation.dto.ts
│   └── conversation-insight.dto.ts
├── interfaces/
│   ├── conversation-analysis.interface.ts
│   └── insight.interface.ts
├── runners/
│   └── conversation-explorer.runner.ts
└── conversation-explorer.module.ts
```

## 2. Core Components

### 2.1 Entity Definitions
```typescript
// src/modules/conversation-explorer/entities/conversation.entity.ts
@Entity()
export class Conversation extends BaseEntity {
  @Column()
  brandId: string;

  @Column('jsonb')
  messages: {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[];

  @Column('jsonb')
  metadata: {
    platform: string;
    context: string;
    tags: string[];
  };

  @OneToMany(() => ConversationInsight, insight => insight.conversation)
  insights: ConversationInsight[];

  @Column('float')
  engagementScore: number;

  @CreateDateColumn()
  analyzedAt: Date;
}

// src/modules/conversation-explorer/entities/conversation-insight.entity.ts
@Entity()
export class ConversationInsight extends BaseEntity {
  @ManyToOne(() => Conversation)
  conversation: Conversation;

  @Column('text')
  type: 'intent' | 'sentiment' | 'topic' | 'action';

  @Column('text')
  category: string;

  @Column('float')
  confidence: number;

  @Column('jsonb')
  details: Record<string, unknown>;
}
```

### 2.2 Repository Implementation
```typescript
// src/modules/conversation-explorer/repositories/conversation.repository.ts
@EntityRepository(Conversation)
export class ConversationRepository extends Repository<Conversation> {
  async findByBrandId(
    brandId: string,
    options: FindManyOptions<Conversation>
  ): Promise<Conversation[]> {
    return this.find({
      where: { brandId },
      ...options,
    });
  }

  async findWithInsights(id: string): Promise<Conversation> {
    return this.createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.insights', 'insights')
      .where('conversation.id = :id', { id })
      .getOne();
  }

  async getEngagementTrend(
    brandId: string,
    startDate: Date,
    endDate: Date
  ): Promise<EngagementTrend[]> {
    return this.createQueryBuilder('conversation')
      .select('DATE(conversation.analyzedAt)', 'date')
      .addSelect('AVG(conversation.engagementScore)', 'averageEngagement')
      .where('conversation.brandId = :brandId', { brandId })
      .andWhere('conversation.analyzedAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(conversation.analyzedAt)')
      .orderBy('DATE(conversation.analyzedAt)', 'ASC')
      .getRawMany();
  }
}
```

### 2.3 Services Implementation

#### Conversation Analyzer Service
```typescript
// src/modules/conversation-explorer/services/conversation-analyzer.service.ts
@Injectable()
export class ConversationAnalyzerService {
  constructor(
    private readonly nlpService: NLPService,
    private readonly cache: CacheService
  ) {}

  async analyzeConversation(messages: Message[]): Promise<ConversationAnalysis> {
    const cacheKey = `conversation:${createHash('md5')
      .update(JSON.stringify(messages))
      .digest('hex')}`;
    
    return this.cache.wrap(cacheKey, async () => {
      const analysis = await this.nlpService.analyzeConversation(messages);
      return {
        intents: this.extractIntents(analysis),
        sentiment: this.calculateSentiment(analysis),
        topics: this.identifyTopics(analysis),
        actions: this.extractActions(analysis),
      };
    });
  }

  private extractIntents(analysis: NLPAnalysis): Intent[] {
    return analysis.intents.map(intent => ({
      category: intent.category,
      confidence: intent.confidence,
      details: intent.context,
    }));
  }

  private calculateSentiment(analysis: NLPAnalysis): Sentiment {
    return {
      overall: analysis.sentiment.score,
      progression: analysis.sentiment.progression,
      aspects: analysis.sentiment.aspects,
    };
  }

  private identifyTopics(analysis: NLPAnalysis): Topic[] {
    return analysis.topics.map(topic => ({
      name: topic.name,
      relevance: topic.relevance,
      mentions: topic.mentions,
    }));
  }

  private extractActions(analysis: NLPAnalysis): Action[] {
    return analysis.actions.map(action => ({
      type: action.type,
      confidence: action.confidence,
      context: action.context,
    }));
  }
}
```

#### Conversation Indexer Service
```typescript
// src/modules/conversation-explorer/services/conversation-indexer.service.ts
@Injectable()
export class ConversationIndexerService {
  constructor(
    @InjectRepository(ConversationInsight)
    private readonly insightRepo: Repository<ConversationInsight>,
    private readonly searchService: SearchService
  ) {}

  async indexConversation(
    conversation: Conversation,
    analysis: ConversationAnalysis
  ): Promise<void> {
    // Index insights
    await Promise.all([
      this.indexIntents(conversation, analysis.intents),
      this.indexTopics(conversation, analysis.topics),
      this.indexActions(conversation, analysis.actions),
    ]);

    // Index for search
    await this.searchService.indexConversation({
      id: conversation.id,
      content: this.extractContent(conversation),
      metadata: {
        ...conversation.metadata,
        insights: analysis,
      },
    });
  }

  private async indexIntents(
    conversation: Conversation,
    intents: Intent[]
  ): Promise<void> {
    await Promise.all(
      intents.map(intent =>
        this.insightRepo.save({
          conversation,
          type: 'intent',
          category: intent.category,
          confidence: intent.confidence,
          details: intent.details,
        })
      )
    );
  }

  private extractContent(conversation: Conversation): string {
    return conversation.messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');
  }
}
```

#### Conversation Explorer Service
```typescript
// src/modules/conversation-explorer/services/conversation-explorer.service.ts
@Injectable()
export class ConversationExplorerService {
  constructor(
    private readonly conversationRepo: ConversationRepository,
    private readonly analyzer: ConversationAnalyzerService,
    private readonly indexer: ConversationIndexerService,
    private readonly metrics: MetricsService
  ) {}

  async analyzeConversation(
    data: AnalyzeConversationDto
  ): Promise<Conversation> {
    const startTime = Date.now();

    try {
      // Analyze conversation
      const analysis = await this.analyzer.analyzeConversation(data.messages);

      // Calculate engagement score
      const engagementScore = this.calculateEngagementScore(
        data.messages,
        analysis
      );

      // Create conversation record
      const conversation = await this.conversationRepo.save({
        brandId: data.brandId,
        messages: data.messages,
        metadata: data.metadata,
        engagementScore,
      });

      // Index conversation and insights
      await this.indexer.indexConversation(conversation, analysis);

      // Record metrics
      const duration = Date.now() - startTime;
      this.metrics.recordAnalysisDuration(duration);

      return this.conversationRepo.findWithInsights(conversation.id);
    } catch (error) {
      this.metrics.incrementErrorCount('analysis_failure');
      throw error;
    }
  }

  async getConversationTrends(
    brandId: string,
    options: TrendOptions
  ): Promise<ConversationTrends> {
    const [conversations, engagementTrend] = await Promise.all([
      this.conversationRepo.findByBrandId(brandId, {
        order: { analyzedAt: 'DESC' },
        take: 100,
      }),
      this.conversationRepo.getEngagementTrend(
        brandId,
        options.startDate,
        options.endDate
      ),
    ]);

    return {
      topIntents: this.extractTopIntents(conversations),
      topTopics: this.extractTopTopics(conversations),
      engagementTrend,
      commonActions: this.extractCommonActions(conversations),
    };
  }

  private calculateEngagementScore(
    messages: Message[],
    analysis: ConversationAnalysis
  ): number {
    const factors = {
      messageCount: messages.length * 0.2,
      averageLength:
        (messages.reduce(
          (sum, msg) => sum + msg.content.length,
          0
        ) /
          messages.length) *
        0.3,
      sentimentProgression: analysis.sentiment.progression * 0.25,
      intentConfidence:
        analysis.intents.reduce(
          (sum, intent) => sum + intent.confidence,
          0
        ) * 0.25,
    };

    return Object.values(factors).reduce((sum, score) => sum + score, 0);
  }

  private extractTopIntents(conversations: Conversation[]): TopIntent[] {
    const intents = conversations.flatMap(conv =>
      conv.insights
        .filter(insight => insight.type === 'intent')
        .map(insight => ({
          category: insight.category,
          confidence: insight.confidence,
        }))
    );

    return this.aggregateByCategory(intents);
  }

  private aggregateByCategory<T extends { category: string; confidence: number }>(
    items: T[]
  ): { category: string; count: number; averageConfidence: number }[] {
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { count: 0, totalConfidence: 0 };
      }
      acc[item.category].count++;
      acc[item.category].totalConfidence += item.confidence;
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number }>);

    return Object.entries(grouped)
      .map(([category, { count, totalConfidence }]) => ({
        category,
        count,
        averageConfidence: totalConfidence / count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}
```

### 2.4 Controller Implementation
```typescript
// src/modules/conversation-explorer/controllers/conversation-explorer.controller.ts
@Controller('conversation-explorer')
export class ConversationExplorerController {
  constructor(
    private readonly conversationExplorerService: ConversationExplorerService
  ) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeConversation(
    @Body() data: AnalyzeConversationDto
  ): Promise<ConversationDto> {
    const conversation = await this.conversationExplorerService.analyzeConversation(
      data
    );
    return this.transformToDto(conversation);
  }

  @Get('trends/:brandId')
  @UseGuards(JwtAuthGuard)
  async getConversationTrends(
    @Param('brandId') brandId: string,
    @Query() options: TrendOptionsDto
  ): Promise<ConversationTrends> {
    return this.conversationExplorerService.getConversationTrends(
      brandId,
      options
    );
  }

  private transformToDto(conversation: Conversation): ConversationDto {
    return {
      id: conversation.id,
      brandId: conversation.brandId,
      messages: conversation.messages,
      metadata: conversation.metadata,
      insights: conversation.insights.map(insight => ({
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        details: insight.details,
      })),
      engagementScore: conversation.engagementScore,
      analyzedAt: conversation.analyzedAt,
    };
  }
}
```

### 2.5 Runner Implementation
```typescript
// src/modules/conversation-explorer/runners/conversation-explorer.runner.ts
@Injectable()
export class ConversationExplorerRunner implements FeatureRunner {
  constructor(
    private readonly conversationExplorerService: ConversationExplorerService,
    private readonly configService: ConfigService
  ) {}

  getName(): string {
    return 'conversation-explorer';
  }

  async isEnabled(): Promise<boolean> {
    return this.configService.get('features.conversationExplorer.enabled', true);
  }

  async run(context: FeatureContext): Promise<FeatureResult> {
    try {
      const conversation = await this.conversationExplorerService.analyzeConversation({
        brandId: context.brandId,
        messages: context.metadata?.messages as Message[],
        metadata: context.metadata?.metadata as any,
      });

      const trends = await this.conversationExplorerService.getConversationTrends(
        context.brandId,
        {
          startDate: subDays(new Date(), 30),
          endDate: new Date(),
        }
      );

      return {
        success: true,
        data: {
          conversation,
          trends,
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
// src/modules/conversation-explorer/conversation-explorer.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, ConversationInsight]),
    CacheModule.register(),
  ],
  controllers: [ConversationExplorerController],
  providers: [
    ConversationExplorerService,
    ConversationAnalyzerService,
    ConversationIndexerService,
    ConversationExplorerRunner,
    {
      provide: NLPService,
      useClass: process.env.NODE_ENV === 'test' ? MockNLPService : NLPService,
    },
  ],
  exports: [ConversationExplorerRunner],
})
export class ConversationExplorerModule {}
```

## 4. Testing Implementation

### 4.1 Service Tests
```typescript
// src/modules/conversation-explorer/__tests__/unit/conversation-explorer.service.spec.ts
describe('ConversationExplorerService', () => {
  let service: ConversationExplorerService;
  let conversationRepo: MockType<ConversationRepository>;
  let analyzer: MockType<ConversationAnalyzerService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationExplorerService,
        {
          provide: ConversationRepository,
          useFactory: createMock,
        },
        {
          provide: ConversationAnalyzerService,
          useFactory: createMock,
        },
        {
          provide: ConversationIndexerService,
          useFactory: createMock,
        },
        {
          provide: MetricsService,
          useFactory: createMock,
        },
      ],
    }).compile();

    service = module.get<ConversationExplorerService>(ConversationExplorerService);
    conversationRepo = module.get(getRepositoryToken(Conversation));
    analyzer = module.get(ConversationAnalyzerService);
  });

  describe('analyzeConversation', () => {
    it('should analyze conversation and save insights', async () => {
      // Test implementation
    });

    it('should calculate engagement score correctly', async () => {
      // Test implementation
    });

    it('should handle indexing errors gracefully', async () => {
      // Test implementation
    });
  });
});
```

### 4.2 Integration Tests
```typescript
// src/modules/conversation-explorer/__tests__/integration/conversation-explorer.controller.spec.ts
describe('ConversationExplorer Integration', () => {
  let app: INestApplication;
  let conversationRepo: ConversationRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ConversationExplorerModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    conversationRepo = moduleFixture.get<ConversationRepository>(
      getRepositoryToken(Conversation)
    );
  });

  describe('POST /conversation-explorer/analyze', () => {
    it('should analyze conversation successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/conversation-explorer/analyze')
        .send({
          brandId: 'test-brand',
          messages: [
            {
              role: 'user',
              content: 'Test message',
              timestamp: new Date(),
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
        brandId: 'test-brand',
        engagementScore: expect.any(Number),
        insights: expect.arrayContaining([
          expect.objectContaining({
            type: expect.any(String),
            confidence: expect.any(Number),
          }),
        ]),
      });
    });
  });
});
```

## 5. Migration Script
```typescript
// src/modules/conversation-explorer/migrations/1234567890-CreateConversationExplorerTables.ts
export class CreateConversationExplorerTables1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'conversation',
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
            name: 'messages',
            type: 'jsonb',
          },
          {
            name: 'metadata',
            type: 'jsonb',
          },
          {
            name: 'engagement_score',
            type: 'float',
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
        name: 'conversation_insight',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'conversation_id',
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
            name: 'confidence',
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
            columnNames: ['conversation_id'],
            referencedColumnNames: ['id'],
            referencedTableName: 'conversation',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndices('conversation', [
      new TableIndex({
        name: 'IDX_conversation_brand_id',
        columnNames: ['brand_id'],
      }),
      new TableIndex({
        name: 'IDX_conversation_analyzed_at',
        columnNames: ['analyzed_at'],
      }),
    ]);

    await queryRunner.createIndices('conversation_insight', [
      new TableIndex({
        name: 'IDX_conversation_insight_conversation_id',
        columnNames: ['conversation_id'],
      }),
      new TableIndex({
        name: 'IDX_conversation_insight_type',
        columnNames: ['type'],
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('conversation_insight');
    await queryRunner.dropTable('conversation');
  }
}
```

### 3.2 Conversation Explorer
- [ ] Build query trend analysis system
  - [ ] Implement trend detection
  - [ ] Set up trend caching (TTL: 15 minutes)
  - [ ] Configure scheduled cache updates
- [ ] Create topic clustering service
  - [ ] Implement clustering algorithm
  - [ ] Set up cluster caching (TTL: 1 hour)
  - [ ] Add cache invalidation on new data
- [ ] Implement volume estimation
  - [ ] Create volume calculation service
  - [ ] Configure volume cache (TTL: 30 minutes)
  - [ ] Set up periodic cache refresh
- [ ] Create topic gap analyzer
  - [ ] Implement gap analysis
  - [ ] Set up analysis caching (TTL: 1 hour)
  - [ ] Configure cache invalidation rules
- [ ] Build content suggestion system
  - [ ] Implement suggestion algorithm
  - [ ] Set up suggestion caching (TTL: 30 minutes)
  - [ ] Add cache invalidation on updates 