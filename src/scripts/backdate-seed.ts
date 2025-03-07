import { DataSource, In } from 'typeorm';
import { DefaultNamingStrategy } from 'typeorm';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';
import { QueryTemplateEntity } from '../modules/brand-analytics/entities/query-template.entity';
import { BrandVisibilityService } from '../analytics/services/brand-visibility.service';
import { OpenAIProviderService } from '../modules/ai-provider/services/openai-provider.service';
import { NLPService } from '../modules/nlp/nlp.service';
import { QuestionValidatorService } from '../analytics/services/question-validator.service';
import { CustomerResearchService } from '../modules/brand-analytics/services/customer-research.service';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import * as readline from 'readline';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const TARGET_TEMPLATE_QUESTIONS = 50; // 50 questions per type (industry/context) = 100 total

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Promisify readline question
const question = (query: string): Promise<string> => {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
};

// Parse date input from user
async function getBackdateTimestamp(): Promise<Date> {
  const dateInput = await question(
    'Enter the date to backdate to (YYYY-MM-DD): ',
  );
  const timeInput = await question(
    'Enter the time (HH:MM in 24-hour format): ',
  );

  const timestamp = new Date(`${dateInput}T${timeInput}:00`);

  if (isNaN(timestamp.getTime())) {
    throw new Error('Invalid date/time format');
  }

  return timestamp;
}

// Simple ConfigService implementation
class SimpleConfigService extends ConfigService {
  constructor(private envConfig: Record<string, any>) {
    super();
  }

  get<T>(key: string): T {
    return this.envConfig[key] as T;
  }
}

interface PromisePoolConfig {
  maxConcurrent: number;
  retryAttempts: number;
  initialRetryDelay: number;
  maxRetryDelay: number;
}

class PromisePool {
  private queue: (() => Promise<any>)[] = [];
  private running = 0;
  private results: any[] = [];
  private config: PromisePoolConfig;
  private processed = 0;
  private total = 0;
  private startTime: number;

  constructor(config: PromisePoolConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  setTotal(total: number) {
    this.total = total;
    console.log(`\nInitializing processing pool for ${total} items`);
  }

  private logProgress() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = this.processed / elapsed;
    const remaining = this.total - this.processed;
    const estimatedTimeRemaining = remaining / rate;

    console.log(
      `Progress: ${this.processed}/${this.total} (${Math.round((this.processed / this.total) * 100)}%) | ` +
        `Running: ${this.running} | ` +
        `Queue: ${this.queue.length} | ` +
        `Rate: ${rate.toFixed(2)}/s | ` +
        `Est. remaining: ${Math.round(estimatedTimeRemaining / 60)}m ${Math.round(estimatedTimeRemaining % 60)}s`,
    );
  }

  async add(task: () => Promise<any>): Promise<void> {
    this.queue.push(task);
    await this.run();
  }

  private async run(): Promise<void> {
    if (this.running >= this.config.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const task = this.queue.shift()!;

    try {
      const result = await this.executeWithRetry(task);
      this.results.push(result);
      this.processed++;
      if (this.processed % 10 === 0) {
        this.logProgress();
      }
    } catch (error) {
      console.error('Task failed after all retries:', error);
    } finally {
      this.running--;
      await this.run();
    }
  }

  private async executeWithRetry(
    task: () => Promise<any>,
    attempt = 1,
  ): Promise<any> {
    try {
      return await task();
    } catch (error) {
      if (attempt >= this.config.retryAttempts) {
        throw error;
      }

      const delay = Math.min(
        this.config.initialRetryDelay * Math.pow(2, attempt - 1),
        this.config.maxRetryDelay,
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.executeWithRetry(task, attempt + 1);
    }
  }

  async waitForAll(): Promise<any[]> {
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return this.results;
  }
}

const logger = new Logger('BackdateSeed');

interface TemplateContext {
  competitor: CompetitorEntity;
  industry: IndustryEntity;
  type: string;
}

function getPlaceholderValue(
  placeholder: string,
  context: TemplateContext,
): string {
  const getRandomItem = <T>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)];
  const getRandomItems = <T>(items: T[], count: number): T[] => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const adjectives = [
    'leading',
    'top',
    'major',
    'prominent',
    'key',
    'notable',
    'significant',
    'established',
    'recognized',
    'respected',
    'innovative',
    'cutting-edge',
    'premier',
    'primary',
    'essential',
    'fundamental',
    'critical',
    'strategic',
    'influential',
    'dominant',
    'pioneering',
    'transformative',
    'emerging',
    'specialized',
    'trusted',
  ];

  const scopes = [
    'global',
    'international',
    'worldwide',
    'market-leading',
    'industry-leading',
    'innovative',
    'regional',
    'national',
    'sector-specific',
    'cross-industry',
    'enterprise-grade',
    'commercial',
    'professional',
    'business',
    'technical',
    'specialized',
    'advanced',
  ];

  const allSegments = [
    'enterprise',
    'small business',
    'mid-market',
    'startup',
    'corporate',
    'government',
    'education',
    'Fortune 500',
    'SMB',
    'large enterprise',
    'public sector',
    'private sector',
    'non-profit',
    'healthcare',
    'financial',
    'technology',
    'retail',
    'manufacturing',
  ];

  const verbs = [
    'using',
    'leveraging',
    'implementing',
    'deploying',
    'offering',
    'providing',
    'developing',
    'delivering',
    'supporting',
    'enabling',
    'powering',
    'driving',
  ];

  const impacts = [
    'impact',
    'influence',
    'role',
    'contribution',
    'position',
    'presence',
    'effectiveness',
    'performance',
    'success',
    'achievement',
    'innovation',
  ];

  const timeframes = [
    'current',
    'emerging',
    'evolving',
    'future',
    'long-term',
    'short-term',
    'immediate',
    'ongoing',
    'projected',
    'anticipated',
    'planned',
  ];

  const addRandomAdjective = (base: string): string => {
    const adjectiveCount = Math.random() < 0.3 ? 2 : 1;
    const selectedAdjectives = getRandomItems(adjectives, adjectiveCount);
    return `${selectedAdjectives.join(' ')} ${base}`;
  };

  const addRandomScope = (base: string): string => {
    if (Math.random() > 0.3) {
      const scopeCount = Math.random() < 0.2 ? 2 : 1;
      const selectedScopes = getRandomItems(scopes, scopeCount);
      return `${selectedScopes.join(' ')} ${base}`;
    }
    return base;
  };

  const addVerb = (base: string): string =>
    Math.random() > 0.5 ? `${getRandomItem(verbs)} ${base}` : base;

  const addImpact = (base: string): string =>
    Math.random() > 0.6 ? `${base} ${getRandomItem(impacts)}` : base;

  const addTimeframe = (base: string): string =>
    Math.random() > 0.7 ? `${getRandomItem(timeframes)} ${base}` : base;

  // Declare variables before switch
  const solutionTypes = [
    'solutions',
    'offerings',
    'capabilities',
    'services',
    'products',
    'portfolio',
  ];
  const techTerms = [
    'technology',
    'platform',
    'system',
    'infrastructure',
    'framework',
    'solution',
    'architecture',
    'ecosystem',
    'toolset',
    'suite',
    'environment',
    'stack',
  ];
  const segmentCount = Math.random() < 0.4 ? 2 : 1;

  switch (placeholder) {
    case 'industry':
      return addTimeframe(addRandomScope(context.industry?.name || ''));
    case 'company':
      return addVerb(addRandomScope(context.competitor.name));
    case 'product/service':
      return addImpact(addRandomAdjective(context.industry?.name || ''));
    case 'solution_type':
      return addVerb(
        addRandomAdjective(
          `${context.industry?.name} ${getRandomItem(solutionTypes)}`,
        ),
      );
    case 'technology':
      return addImpact(
        addRandomAdjective(
          `${context.industry?.name} ${getRandomItem(techTerms)}`,
        ),
      );
    case 'target_segment':
      return addTimeframe(
        getRandomItems(allSegments, segmentCount).join(' and '),
      );
    default:
      return '';
  }
}

async function fillTemplate(
  template: string,
  placeholders: string[],
  context: TemplateContext,
): Promise<string> {
  const getRandomItem = <T>(items: T[]): T =>
    items[Math.floor(Math.random() * items.length)];
  let filledTemplate = template;

  const contexts = [
    'in the current market',
    'in terms of market presence',
    'from a customer perspective',
    'in terms of industry impact',
    'regarding market positioning',
    'in the competitive landscape',
    'within the industry ecosystem',
    'across different market segments',
    'in terms of brand recognition',
    'from an innovation standpoint',
    'considering market dynamics',
    'in the evolving landscape',
    'from a technological perspective',
    'in terms of customer adoption',
    'regarding industry leadership',
    'with respect to customer satisfaction',
    'in relation to market share',
    'concerning digital transformation',
    'regarding customer experience',
    'in the context of industry trends',
    'with focus on innovation',
    'in terms of competitive advantage',
    'considering growth potential',
    'from a market penetration perspective',
    'in light of recent developments',
  ];

  const structures = [
    'What is the {aspect} of',
    'How does {aspect} compare to',
    'Can you evaluate the {aspect} of',
    'What role does {aspect} play in',
    'How significant is the {aspect} of',
    'What factors contribute to {aspect} of',
    'How effectively does {aspect} address',
    'What distinguishes {aspect} from',
    'How has {aspect} evolved in',
    'What impact does {aspect} have on',
  ];

  if (Math.random() > 0.7) {
    const aspects = [
      'market position',
      'competitive advantage',
      'industry presence',
      'technological capability',
      'customer satisfaction',
      'innovation strategy',
      'market penetration',
      'brand recognition',
      'service delivery',
      'product portfolio',
      'market leadership',
      'customer base',
    ];
    const structure = getRandomItem(structures).replace(
      '{aspect}',
      getRandomItem(aspects),
    );
    filledTemplate = structure + ' ' + filledTemplate.toLowerCase();
  }

  if (Math.random() > 0.5) {
    filledTemplate = `${getRandomItem(contexts)}, ${filledTemplate.toLowerCase()}`;
  }
  if (Math.random() > 0.6) {
    filledTemplate = `${filledTemplate} ${getRandomItem(contexts)}`;
  }

  for (const placeholder of placeholders) {
    const value = getPlaceholderValue(placeholder, context);
    filledTemplate = filledTemplate.replace(`{${placeholder}}`, value);
  }

  return filledTemplate;
}

async function generateQuestionsForType(
  competitor: CompetitorEntity,
  templates: QueryTemplateEntity[],
  type: string,
): Promise<Set<string>> {
  const questions = new Set<string>();
  logger.log(
    `Generating questions for type ${type} with ${templates.length} templates`,
  );

  const templateAttempts = new Map<string, number>();
  const maxAttemptsPerTemplate = 100;

  while (questions.size < TARGET_TEMPLATE_QUESTIONS) {
    let madeProgress = false;

    for (const template of templates) {
      if (questions.size === TARGET_TEMPLATE_QUESTIONS) {
        break;
      }

      const currentAttempts = templateAttempts.get(template.id) || 0;

      if (currentAttempts >= maxAttemptsPerTemplate) {
        continue;
      }

      logger.log(
        `Processing template ${template.id} (${questions.size}/${TARGET_TEMPLATE_QUESTIONS} questions generated, attempt ${currentAttempts + 1})`,
      );

      try {
        let placeholders: string[] = [];
        try {
          placeholders = template.placeholders || [];
        } catch (error) {
          logger.error(
            `Error parsing placeholders for template ${template.id}:`,
            error,
          );
          continue;
        }

        const filledTemplate = await fillTemplate(
          template.template,
          placeholders,
          {
            competitor,
            industry: competitor.industry,
            type: template.type,
          },
        );

        if (!questions.has(filledTemplate)) {
          questions.add(filledTemplate);
          madeProgress = true;

          if (questions.size % 10 === 0) {
            logger.log(`Generated ${questions.size} total questions so far`);
          }
        }

        templateAttempts.set(template.id, currentAttempts + 1);
      } catch (error) {
        logger.error(`Error processing template ${template.id}:`, error);
        templateAttempts.set(template.id, currentAttempts + 1);
      }
    }

    if (
      !madeProgress &&
      Array.from(templateAttempts.values()).every(
        attempts => attempts >= maxAttemptsPerTemplate,
      )
    ) {
      logger.warn(
        `Unable to generate ${TARGET_TEMPLATE_QUESTIONS} questions after maximum attempts. Generated ${questions.size} questions.`,
      );
      break;
    }
  }

  if (questions.size > TARGET_TEMPLATE_QUESTIONS) {
    const questionsArray = Array.from(questions);
    questions.clear();
    for (let i = 0; i < TARGET_TEMPLATE_QUESTIONS; i++) {
      questions.add(questionsArray[i]);
    }
  }

  logger.log(`Final question count for type ${type}: ${questions.size}`);
  return questions;
}

async function generateQuestions(
  competitor: CompetitorEntity,
  dataSource: DataSource,
): Promise<{ [key: string]: string[] }> {
  const questionsByType: { [key: string]: string[] } = {};

  const queryTemplateRepo = dataSource.getRepository(QueryTemplateEntity);
  const templates = await queryTemplateRepo.find({
    where: {
      isActive: true,
      query_type: In(['industry', 'context']),
    },
    order: {
      priority: 'DESC',
    },
  });

  if (!templates || templates.length === 0) {
    throw new Error('No active query templates found in database');
  }

  for (const type of ['industry', 'context']) {
    const typeTemplates = templates.filter(t => t.query_type === type);
    const questionsSet = await generateQuestionsForType(
      competitor,
      typeTemplates,
      type,
    );

    const questionsArray = [...questionsSet];
    if (questionsArray.length !== questionsSet.size) {
      logger.error(
        `Question count mismatch! Set size: ${questionsSet.size}, Array length: ${questionsArray.length}`,
      );
      questionsSet.forEach(q => {
        if (!questionsArray.includes(q)) {
          questionsArray.push(q);
        }
      });
    }

    logger.log(
      `Converting ${questionsSet.size} questions to array for type ${type}. Final array length: ${questionsArray.length}`,
    );
    questionsByType[type] = questionsArray;
  }

  return questionsByType;
}

function convertLeadershipToScore(leadership: string): number {
  const leadershipScores: { [key: string]: number } = {
    dominant: 1.0,
    leader: 0.9,
    pioneer: 0.85,
    strong: 0.8,
    established: 0.7,
    emerging: 0.6,
    challenger: 0.5,
    niche: 0.4,
    new: 0.3,
  };

  const normalizedLeadership = leadership.toLowerCase().replace(/[^a-z]/g, '');
  return leadershipScores[normalizedLeadership] || 0.5;
}

async function backdateSeed() {
  console.log('\n=== Starting Backdate Seed Process ===\n');

  // Get backdate timestamp from user
  const backdateTimestamp = await getBackdateTimestamp();
  console.log(
    `\nSeeding data with timestamp: ${backdateTimestamp.toISOString()}\n`,
  );

  const password = process.env.SUPABASE_PASSWORD;
  if (!password) {
    throw new Error('SUPABASE_PASSWORD is not configured');
  }

  const connectionString = `postgresql://postgres.hgmbooestwqhfempyjun:${password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

  const dataSource = new DataSource({
    type: 'postgres',
    url: connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    entities: [CompetitorEntity, IndustryEntity, QueryTemplateEntity],
    synchronize: false,
    logging: false,
    namingStrategy: new DefaultNamingStrategy(),
  });

  try {
    console.log('Initializing database connection...');
    await Promise.race([
      dataSource.initialize(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Database connection timeout after 30s')),
          30000,
        ),
      ),
    ]);
    console.log('✓ Connected to database\n');

    console.log('Initializing services...');
    const configService = new SimpleConfigService({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    });
    const openAIProvider = new OpenAIProviderService(configService);
    const nlpService = new NLPService(openAIProvider);
    const questionValidator = new QuestionValidatorService(openAIProvider);

    const competitorRepository = dataSource.getRepository(CompetitorEntity);
    const industryRepository = dataSource.getRepository(IndustryEntity);

    const customerResearchService = new CustomerResearchService(
      competitorRepository,
      industryRepository,
    );

    const brandVisibilityService = new BrandVisibilityService(
      openAIProvider,
      questionValidator,
      customerResearchService,
      nlpService,
    );
    console.log('✓ Services initialized\n');

    console.log('Fetching customers from database...');
    const customers = (await Promise.race([
      dataSource
        .getRepository(CompetitorEntity)
        .createQueryBuilder('competitor')
        .leftJoinAndSelect('competitor.industry', 'industry')
        .where('competitor.isCustomer = :isCustomer', { isCustomer: true })
        .getMany(),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Customer fetch timeout after 30s')),
          30000,
        ),
      ),
    ])) as CompetitorEntity[];

    console.log(`Found ${customers.length} customers to process\n`);

    const pool = new PromisePool({
      maxConcurrent: 2,
      retryAttempts: 3,
      initialRetryDelay: 1000,
      maxRetryDelay: 32000,
    });

    const totalQuestions = customers.length * 100; // 50 per type * 2 types
    pool.setTotal(totalQuestions);

    let cachedTemplates;

    for (const customer of customers) {
      console.log(`\n=== Processing Customer: ${customer.name} ===`);
      const questionsByType = await generateQuestions(customer, dataSource);

      if (!cachedTemplates) {
        cachedTemplates = await dataSource.query(
          `
          SELECT 
            template.id,
            template.template,
            template.type,
            template.query_type,
            template.placeholders,
            template."requiredPlaceholders",
            template.priority,
            template."isActive",
            template."createdAt",
            template."updatedAt"
          FROM query_templates template
          WHERE template."isActive" = true 
          AND template.query_type = ANY($1)
          ORDER BY template.priority DESC
        `,
          [['industry', 'context']],
        );
      }

      for (const [queryType, questions] of Object.entries(questionsByType)) {
        console.log(
          `\nProcessing ${questions.length} ${queryType} questions for ${customer.name}`,
        );

        console.log('Sending batch to visibility service...');
        const batchResults =
          await brandVisibilityService.analyzeBrandVisibilityBatch(
            customer,
            questions,
            { maxConcurrent: 2 },
          );

        console.log(
          `Starting to process ${batchResults.length} analysis results...`,
        );

        for (const analysis of batchResults) {
          await pool.add(async () => {
            try {
              await dataSource.query(
                `
                INSERT INTO analytics_results (
                  company_id,
                  query_text,
                  response_text,
                  visibility_score,
                  prominence_score,
                  context_score,
                  authority_score,
                  citation_frequency,
                  category_leadership,
                  competitor_proximity,
                  knowledge_base_metrics,
                  trends,
                  response_metadata,
                  query_type,
                  timestamp,
                  analysis,
                  metadata,
                  mention_count,
                  sentiment_score,
                  relevance_score
                ) VALUES (
                  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
                )
              `,
                [
                  customer.id,
                  analysis.question,
                  analysis.aiResponse.content,
                  analysis.brandHealth.visibilityMetrics.overallVisibility,
                  analysis.metrics.visibilityStats.prominenceScore,
                  analysis.brandMentions[0].visibility.contextScore,
                  analysis.brandMentions[0].knowledgeBaseMetrics.authorityScore,
                  analysis.brandMentions[0].knowledgeBaseMetrics
                    .citationFrequency,
                  convertLeadershipToScore(
                    analysis.brandMentions[0].knowledgeBaseMetrics
                      .categoryLeadership,
                  ),
                  JSON.stringify(
                    analysis.brandMentions[0].visibility.competitorProximity,
                  ),
                  JSON.stringify(analysis.brandHealth.llmPresence),
                  JSON.stringify(analysis.brandHealth.trendsOverTime),
                  JSON.stringify(analysis.aiResponse.metadata),
                  queryType,
                  backdateTimestamp,
                  JSON.stringify(analysis),
                  JSON.stringify({
                    version: '1.0.0',
                    batchId: backdateTimestamp.toISOString(),
                    queryType: queryType,
                    index: 1,
                  }),
                  analysis.aiResponse.content
                    .toLowerCase()
                    .includes(customer.name.toLowerCase())
                    ? 1
                    : 0,
                  analysis.brandMentions.reduce((sum, mention) => {
                    const contextualSentiment =
                      mention.visibility.contextScore * 0.3;
                    const authorityImpact =
                      mention.knowledgeBaseMetrics.authorityScore * 0.2;
                    const citationImpact =
                      Math.min(
                        mention.knowledgeBaseMetrics.citationFrequency / 10,
                        1,
                      ) * 0.2;
                    const leadershipImpact =
                      convertLeadershipToScore(
                        mention.knowledgeBaseMetrics.categoryLeadership,
                      ) * 0.3;
                    return (
                      sum +
                      (contextualSentiment +
                        authorityImpact +
                        citationImpact +
                        leadershipImpact)
                    );
                  }, 0) / analysis.brandMentions.length,
                  (analysis.brandMentions[0].visibility.contextScore +
                    analysis.brandHealth.visibilityMetrics.overallVisibility +
                    convertLeadershipToScore(
                      analysis.brandMentions[0].knowledgeBaseMetrics
                        .categoryLeadership,
                    )) /
                    3,
                ],
              );

              return analysis;
            } catch (error) {
              console.error(
                `Error processing ${queryType} question for ${customer.name}:`,
                error,
              );
              throw error;
            }
          });
        }
      }
    }

    await pool.waitForAll();
    console.log('\n✓ All analytics processing completed');
  } catch (error) {
    console.error('\n❌ Error processing customer analytics:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✓ Database connection closed');
    }
    rl.close();
  }
}

backdateSeed().catch(console.error);
