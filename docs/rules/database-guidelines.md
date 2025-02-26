# Database Guidelines

## Core Database Principles

1. **Data Organization**
   - Clear schema design
   - Proper relationships
   - Consistent naming
   - Appropriate indexing

2. **Performance Optimization**
   - Query optimization
   - Proper indexing strategy
   - Connection pooling
   - Caching strategy

## Schema Design

### 1. Entity Definitions
```typescript
@Entity()
export class Content {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  body: string;

  @Column({ type: 'enum', enum: ContentStatus })
  status: ContentStatus;

  @ManyToOne(() => User)
  @JoinColumn()
  author: User;

  @OneToMany(() => Comment, comment => comment.content)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

### 2. Relationship Mapping
```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @OneToMany(() => Content, content => content.author)
  contents: Content[];

  @ManyToMany(() => Role)
  @JoinTable()
  roles: Role[];
}
```

## Repository Pattern

### 1. Base Repository
```typescript
@Injectable()
export class BaseRepository<T> {
  constructor(
    @InjectRepository(GenericEntity)
    private readonly repository: Repository<T>
  ) {}

  async findById(id: string): Promise<T> {
    const entity = await this.repository.findOne(id);
    if (!entity) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
    return entity;
  }

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const result = await this.repository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Entity with id ${id} not found`);
    }
  }
}
```

### 2. Custom Repository
```typescript
@EntityRepository(Content)
export class ContentRepository extends Repository<Content> {
  async findWithRelations(id: string): Promise<Content> {
    return this.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .leftJoinAndSelect('content.comments', 'comments')
      .where('content.id = :id', { id })
      .getOne();
  }

  async findByStatus(
    status: ContentStatus,
    options: FindManyOptions<Content>
  ): Promise<Content[]> {
    return this.find({
      where: { status },
      ...options
    });
  }
}
```

## Query Optimization

### 1. Query Builder Usage
```typescript
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>
  ) {}

  async findContentsByFilters(filters: ContentFilters): Promise<Content[]> {
    const query = this.contentRepo.createQueryBuilder('content')
      .leftJoinAndSelect('content.author', 'author')
      .where('1 = 1');

    if (filters.status) {
      query.andWhere('content.status = :status', { status: filters.status });
    }

    if (filters.authorId) {
      query.andWhere('author.id = :authorId', { authorId: filters.authorId });
    }

    if (filters.search) {
      query.andWhere(
        '(content.title ILIKE :search OR content.body ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query
      .orderBy('content.createdAt', 'DESC')
      .take(filters.limit)
      .skip(filters.offset)
      .getMany();
  }
}
```

### 2. Index Management
```typescript
@Entity()
@Index(['title', 'status'])
@Index(['createdAt'])
export class Content {
  @Column({ length: 255 })
  @Index()
  title: string;

  @Column('text')
  body: string;

  @Column({ type: 'enum', enum: ContentStatus })
  @Index()
  status: ContentStatus;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
```

## Transaction Management

### 1. Transaction Decorators
```typescript
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  @Transaction()
  async createContentWithComments(
    @TransactionManager() manager: EntityManager,
    data: CreateContentDto
  ): Promise<Content> {
    const content = manager.create(Content, {
      title: data.title,
      body: data.body,
      author: data.authorId
    });

    const savedContent = await manager.save(content);

    const comments = data.comments.map(comment =>
      manager.create(Comment, {
        content: savedContent,
        text: comment.text,
        author: comment.authorId
      })
    );

    await manager.save(comments);
    return savedContent;
  }
}
```

### 2. Manual Transaction Management
```typescript
@Injectable()
export class ContentService {
  constructor(
    private readonly connection: Connection
  ) {}

  async updateContentAndMetadata(
    id: string,
    data: UpdateContentDto
  ): Promise<Content> {
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const content = await queryRunner.manager.findOne(Content, id);
      if (!content) {
        throw new NotFoundException();
      }

      content.title = data.title;
      content.body = data.body;
      await queryRunner.manager.save(content);

      const metadata = await queryRunner.manager.findOne(ContentMetadata, {
        content: id
      });
      metadata.lastModified = new Date();
      await queryRunner.manager.save(metadata);

      await queryRunner.commitTransaction();
      return content;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
```

## Migration Management

### 1. Migration Creation
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "content" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "body" text NOT NULL,
        "status" "content_status_enum" NOT NULL DEFAULT 'draft',
        "author_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_content" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_content_title_status" ON "content" ("title", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_content_title_status"`);
    await queryRunner.query(`DROP TABLE "content"`);
  }
}
```

### 2. Migration Configuration
```typescript
// ormconfig.js
module.exports = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  cli: {
    migrationsDir: 'src/migrations'
  },
  migrationsRun: true,
  synchronize: false
};
```

## Performance Monitoring

### 1. Query Logging
```typescript
@Injectable()
export class QueryLogger implements Logger {
  logQuery(query: string, parameters?: any[]) {
    console.log('Query:', query);
    console.log('Parameters:', parameters);
  }

  logQueryError(error: string, query: string, parameters?: any[]) {
    console.error('Query Error:', error);
    console.error('Query:', query);
    console.error('Parameters:', parameters);
  }

  logQuerySlow(time: number, query: string, parameters?: any[]) {
    console.warn('Slow Query:', query);
    console.warn('Time:', time);
    console.warn('Parameters:', parameters);
  }
}
```

### 2. Performance Metrics
```typescript
@Injectable()
export class DatabaseMetricsService {
  constructor(
    private readonly connection: Connection,
    private readonly metrics: MetricsService
  ) {}

  async collectMetrics(): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    
    // Connection pool metrics
    const poolStats = await queryRunner.query(
      'SELECT * FROM pg_stat_activity'
    );
    this.metrics.gauge('db.connections.active', poolStats.length);

    // Query performance metrics
    const queryStats = await queryRunner.query(
      'SELECT * FROM pg_stat_statements'
    );
    for (const stat of queryStats) {
      this.metrics.histogram('db.query.duration', stat.mean_time);
      this.metrics.counter('db.query.calls', stat.calls);
    }
  }
}
```

## Caching Strategy

### 1. Repository Caching
```typescript
@Injectable()
export class CachedContentRepository {
  constructor(
    @InjectRepository(Content)
    private readonly repository: Repository<Content>,
    private readonly cacheManager: Cache
  ) {}

  async findById(id: string): Promise<Content> {
    const cacheKey = `content:${id}`;
    
    const cached = await this.cacheManager.get<Content>(cacheKey);
    if (cached) {
      return cached;
    }

    const content = await this.repository.findOne(id);
    if (!content) {
      throw new NotFoundException();
    }

    await this.cacheManager.set(cacheKey, content, { ttl: 3600 });
    return content;
  }

  async invalidateCache(id: string): Promise<void> {
    await this.cacheManager.del(`content:${id}`);
  }
}
```

### 2. Query Result Caching
```typescript
@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Content)
    private readonly contentRepo: Repository<Content>
  ) {}

  async findPopularContent(): Promise<Content[]> {
    return this.contentRepo.find({
      where: { status: ContentStatus.PUBLISHED },
      order: { views: 'DESC' },
      take: 10,
      cache: {
        id: 'popular_content',
        milliseconds: 300000 // 5 minutes
      }
    });
  }
}
``` 