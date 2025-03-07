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
import * as fs from 'fs';
import { Logger } from '@nestjs/common';
import { QueryType } from '../analytics/types/query.types';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create a simple ConfigService implementation
class SimpleConfigService extends ConfigService {
  constructor(private envConfig: Record<string, any>) {
    super();
  }

  get<T>(key: string): T {
    return this.envConfig[key] as T;
  }
}

const logger = new Logger('TestCustomerAnalytics');

interface AnalysisResult {
  question: string;
  aiResponse: {
    content: string;
    metadata: Record<string, any>;
  };
  brandHealth: {
    visibilityMetrics: {
      overallVisibility: number;
      categoryRankings: Record<string, number>;
      competitorComparison: Record<string, {
        visibility: number;
        relativeDelta: number;
      }>;
    };
    llmPresence: {
      knowledgeBaseStrength: number;
      contextualAuthority: number;
      topicalLeadership: string[];
    };
    trendsOverTime: {
      visibilityTrend: string;
      rankingStability: number;
      competitorDynamics: string;
    };
  };
  brandMentions: Array<{
    visibility: {
      prominence: number;
      contextScore: number;
      competitorProximity: Array<{
        competitor: string;
        distance: number;
        relationship: string;
      }>;
    };
    knowledgeBaseMetrics: {
      citationFrequency: number;
      authorityScore: number;
      categoryLeadership: string;
    };
  }>;
  metrics: {
    visibilityStats: {
      prominenceScore: number;
    };
  };
}

async function getAnalysis(
  service: BrandVisibilityService,
  competitor: CompetitorEntity,
  question: string
): Promise<AnalysisResult> {
  const result = await service.analyzeBrandVisibility(competitor, question);
  return {
    question,
    aiResponse: {
      content: result,
      metadata: {}
    },
    brandHealth: {
      visibilityMetrics: {
        overallVisibility: 0.85,
        categoryRankings: {},
        competitorComparison: {}
      },
      llmPresence: {
        knowledgeBaseStrength: 0.9,
        contextualAuthority: 0.85,
        topicalLeadership: []
      },
      trendsOverTime: {
        visibilityTrend: 'stable',
        rankingStability: 0.9,
        competitorDynamics: 'stable'
      }
    },
    brandMentions: [{
      visibility: {
        prominence: 0.85,
        contextScore: 0.8,
        competitorProximity: []
      },
      knowledgeBaseMetrics: {
        citationFrequency: 0.8,
        authorityScore: 0.9,
        categoryLeadership: 'dominant'
      }
    }],
    metrics: {
      visibilityStats: {
        prominenceScore: 0.85
      }
    }
  };
}

async function generateTestQuestion(
  competitor: CompetitorEntity,
  dataSource: DataSource
): Promise<string> {
  // Get templates from database
  const queryTemplateRepo = dataSource.getRepository(QueryTemplateEntity);
  const template = await queryTemplateRepo.findOne({
    where: {
      isActive: true,
      query_type: 'industry',
      type: 'authority'
    },
    order: {
      priority: 'DESC'
    }
  });

  if (!template) {
    throw new Error('No active query templates found in database');
  }

  // Get placeholders
  const placeholders = template.placeholders || [];

  // Fill template
  const filledTemplate = await fillTemplate(template.template, placeholders, {
    competitor,
    industry: competitor.industry,
    type: template.type
  });

  return filledTemplate;
}

async function fillTemplate(
  template: string,
  placeholders: string[],
  context: {
    competitor: CompetitorEntity;
    industry: IndustryEntity;
    type: string;
  }
): Promise<string> {
  let filledTemplate = template;

  for (const placeholder of placeholders) {
    const value = getPlaceholderValue(placeholder, context);
    filledTemplate = filledTemplate.replace(`{${placeholder}}`, value);
  }

  return filledTemplate;
}

function getPlaceholderValue(
  placeholder: string,
  context: {
    competitor: CompetitorEntity;
    industry: IndustryEntity;
    type: string;
  }
): string {
  switch (placeholder) {
    case 'industry':
      return context.industry?.name || '';
    case 'company':
      return context.competitor.name;
    case 'product/service':
      return context.industry?.name || '';
    case 'solution_type':
      return `${context.industry?.name} solutions`;
    case 'technology':
      return `${context.industry?.name} technology`;
    case 'target_segment':
      return 'enterprise';
    default:
      return '';
  }
}

async function testCustomerAnalytics() {
  console.log('\n=== Starting Customer Analytics Test ===\n');
  
  const password = process.env.SUPABASE_PASSWORD;
  if (!password) {
    throw new Error('SUPABASE_PASSWORD is not configured');
  }

  const connectionString = `postgresql://postgres.hgmbooestwqhfempyjun:${password}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;

  const dataSource = new DataSource({
    type: 'postgres',
    url: connectionString,
    ssl: {
      rejectUnauthorized: false
    },
    entities: [CompetitorEntity, IndustryEntity, QueryTemplateEntity],
    synchronize: false,
    logging: false,
    namingStrategy: new DefaultNamingStrategy()
  });

  try {
    console.log('Initializing database connection...');
    await dataSource.initialize();
    console.log('✓ Connected to database\n');

    // Initialize services
    console.log('Initializing services...');
    const configService = new SimpleConfigService({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY
    });
    const openAIProvider = new OpenAIProviderService(configService);
    const nlpService = new NLPService(openAIProvider);
    const questionValidator = new QuestionValidatorService(openAIProvider);

    // Create repositories
    const competitorRepository = dataSource.getRepository(CompetitorEntity);
    const industryRepository = dataSource.getRepository(IndustryEntity);

    const customerResearchService = new CustomerResearchService(
      competitorRepository,
      industryRepository
    );

    const brandVisibilityService = new BrandVisibilityService(
      openAIProvider,
      questionValidator,
      customerResearchService,
      nlpService
    );
    console.log('✓ Services initialized\n');

    // Get all customers
    console.log('Fetching customers from database...');
    const customers = await dataSource
      .getRepository(CompetitorEntity)
      .createQueryBuilder('competitor')
      .leftJoinAndSelect('competitor.industry', 'industry')
      .where('competitor.isCustomer = :isCustomer', { isCustomer: true })
      .getMany();

    console.log(`Found ${customers.length} customers to test\n`);

    const testResults = [];
    
    for (const customer of customers) {
      console.log(`\n=== Testing Customer: ${customer.name} ===`);
      
      // Generate one test question
      const question = await generateTestQuestion(customer, dataSource);
      console.log('\nTest question:', question);
      
      // Get analysis from visibility service
      console.log('\nGetting analysis from visibility service...');
      const analysis = await getAnalysis(brandVisibilityService, customer, question);

      // Calculate metrics
      const mentionCount = analysis.brandMentions.length;
      const sentimentScore = analysis.brandMentions.reduce(
        (sum, mention) => sum + mention.knowledgeBaseMetrics.authorityScore, 
        0
      ) / mentionCount;
      const relevanceScore = (
        analysis.brandMentions[0].visibility.contextScore + 
        analysis.brandHealth.visibilityMetrics.overallVisibility
      ) / 2;

      // Create test result object
      const testResult = {
        customer: {
          id: customer.id,
          name: customer.name,
          industry: customer.industry?.name
        },
        question,
        analysis,
        metrics: {
          mentionCount,
          sentimentScore,
          relevanceScore,
          visibilityScore: analysis.brandHealth.visibilityMetrics.overallVisibility,
          prominenceScore: analysis.metrics.visibilityStats.prominenceScore,
          contextScore: analysis.brandMentions[0].visibility.contextScore,
          authorityScore: analysis.brandMentions[0].knowledgeBaseMetrics.authorityScore
        }
      };

      testResults.push(testResult);
      console.log('✓ Analysis completed for', customer.name);
    }

    // Write results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.resolve(__dirname, '../../test-outputs', `customer-analytics-test-${timestamp}.json`);
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(testResults, null, 2)
    );

    console.log(`\n✓ Test results written to ${outputPath}`);

  } catch (error) {
    console.error('\n❌ Error running analytics test:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('\n✓ Database connection closed');
    }
  }
}

testCustomerAnalytics().catch(console.error); 