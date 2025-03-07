import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { BrandVisibilityService } from './brand-visibility.service';
import { QuestionValidatorService } from './question-validator.service';
import { AnalyticsResult } from '../entities/analytics-result.entity';
import { ConfigService } from '@nestjs/config';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';
import { CustomerResearchService } from '../../modules/brand-analytics/services/customer-research.service';
import { IndustryEntity } from '../../modules/brand-analytics/entities/industry.entity';
import { QueryTemplateService } from './query-template.service';
import { AnalyticsResultRepository } from '../repositories/analytics-result.repository';
import { QueryType } from '../types/query.types';

// Use require for p-limit since it doesn't have proper ESM support
const pLimit = require('p-limit');

@Injectable()
export class DatabaseSeedingService {
  private readonly logger = new Logger(DatabaseSeedingService.name);
  private readonly limit = pLimit(5); // Limit concurrent operations

  constructor(
    @InjectRepository(AnalyticsResult)
    private readonly analyticsRepository: Repository<AnalyticsResult>,
    private readonly brandVisibilityService: BrandVisibilityService,
    private readonly questionValidator: QuestionValidatorService,
    private readonly customerResearchService: CustomerResearchService,
    private readonly configService: ConfigService,
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
    @InjectRepository(IndustryEntity)
    private readonly industryRepository: Repository<IndustryEntity>,
    private readonly dataSource: DataSource,
    private readonly queryTemplateService: QueryTemplateService,
    private readonly analyticsResultRepository: AnalyticsResultRepository,
  ) {}

  async seedCustomerDatabase(companyId?: string): Promise<void> {
    try {
      // Get companies to seed
      const competitors = companyId
        ? [await this.customerResearchService.getCompetitorById(companyId)]
        : await this.customerResearchService.getAllCompetitors();

      const customersToSeed = competitors.filter(c => c.isCustomer);

      this.logger.log(
        `Starting database seeding for ${customersToSeed.length} customers`,
      );

      for (const customer of customersToSeed) {
        await this.seedSingleCompany(customer);
      }

      this.logger.log('Database seeding completed successfully');
    } catch (error) {
      this.logger.error(`Error during database seeding: ${error.message}`);
      throw error;
    }
  }

  private async seedSingleCompany(competitor: CompetitorEntity): Promise<void> {
    try {
      this.logger.log(`Starting analysis for company: ${competitor.name}`);

      // Get all competitors in the same industry
      const industryCompetitors =
        await this.customerResearchService.getCompetitorsByIndustry(
          competitor.industryId,
        );

      // Get query templates for each type
      const industryTemplates =
        await this.queryTemplateService.getTemplatesByType(QueryType.INDUSTRY);
      const contextTemplates =
        await this.queryTemplateService.getTemplatesByType(QueryType.CONTEXT);
      const competitiveTemplates =
        await this.queryTemplateService.getTemplatesByType(
          QueryType.COMPETITIVE,
        );

      // Generate queries for each type
      const industryQueries = await Promise.all(
        industryTemplates.map(template =>
          this.queryTemplateService.generateQueryVariations(template, 100),
        ),
      ).then(arrays => arrays.flat());

      const contextQueries = await Promise.all(
        contextTemplates.map(template =>
          this.queryTemplateService.generateQueryVariations(template, 100),
        ),
      ).then(arrays => arrays.flat());

      const competitiveQueries = await Promise.all(
        competitiveTemplates.map(template =>
          this.queryTemplateService.generateQueryVariations(template, 100),
        ),
      ).then(arrays => arrays.flat());

      // Combine and shuffle queries
      const allQueries = [
        ...industryQueries.map(q => ({
          type: QueryType.INDUSTRY,
          question: q,
        })),
        ...contextQueries.map(q => ({ type: QueryType.CONTEXT, question: q })),
        ...competitiveQueries.map(q => ({
          type: QueryType.COMPETITIVE,
          question: q,
        })),
      ].sort(() => Math.random() - 0.5);

      // Process each query
      await Promise.all(
        allQueries.map((query, index) =>
          this.limit(async () => {
            try {
              const startTime = Date.now();
              const result =
                await this.brandVisibilityService.analyzeBrandVisibility(
                  competitor,
                  query.question,
                );

              // Validate response
              const template = await this.queryTemplateService
                .getTemplatesByType(query.type)
                .then(templates => templates[0]); // Use first template for validation

              const isValid =
                await this.queryTemplateService.validateQueryResponse(
                  query.question,
                  result,
                  template,
                );

              if (!isValid) {
                this.logger.warn(
                  `Invalid response for query ${index + 1}, skipping...`,
                );
                return;
              }

              // Calculate scores and metrics
              const {
                visibilityScore,
                prominenceScore,
                contextScore,
                authorityScore,
                citationFrequency,
                categoryLeadership,
                competitorProximity,
                knowledgeBaseMetrics,
                trends,
              } = this.calculateMetrics(
                result,
                competitor,
                industryCompetitors,
              );

              // Save the result
              const analyticsData: DeepPartial<AnalyticsResult> = {
                companyId: competitor.id,
                queryType: query.type,
                queryText: query.question,
                responseText: result,
                mentionCount: this.countMentions(result, competitor.name),
                prominenceScore: prominenceScore,
                sentimentScore: 0.8,
                relevanceScore: 0.9,
                contextScore: contextScore,
                visibilityScore: visibilityScore,
                authorityScore: authorityScore,
                citationFrequency: citationFrequency,
                categoryLeadership: '0.8',
                competitorProximity: [
                  {
                    competitor: 'competitor-1',
                    distance: 0.75,
                    relationship: 'competitor',
                  },
                ],
                knowledgeBaseMetrics: {
                  knowledgeBaseStrength: 0.85,
                  contextualAuthority: 0.8,
                  topicalLeadership: [],
                },
                trends: {
                  visibilityTrend: 'increasing',
                  rankingStability: 0.9,
                  competitorDynamics: 'maintaining',
                },
                responseMetadata: {
                  processingTime: Date.now() - startTime,
                  confidenceScore: 0.9,
                },
                analysis: {
                  question: query.question,
                  aiResponse: {
                    content: result,
                    metadata: {
                      model: 'gpt-4',
                      tokens: 1000,
                      rankingData: {
                        brandPosition: 1,
                        competitorPositions: {},
                      },
                    },
                  },
                  brandHealth: {
                    visibilityMetrics: {
                      overallVisibility: 0.85,
                      categoryRankings: {},
                      competitorComparison: {},
                    },
                    llmPresence: {
                      knowledgeBaseStrength: 0.9,
                      contextualAuthority: 0.85,
                      topicalLeadership: [],
                    },
                    trendsOverTime: {
                      visibilityTrend: 'increasing',
                      rankingStability: 0.9,
                      competitorDynamics: 'maintaining',
                    },
                  },
                  brandMentions: [],
                  metrics: {
                    visibilityStats: {
                      prominenceScore: 0.85,
                    },
                  },
                },
                metadata: {
                  version: '1.0',
                  batchId: new Date().toISOString(),
                  queryType: query.type,
                  index: 1,
                },
              };

              // Create and save using repository
              await this.analyticsResultRepository.save(analyticsData);

              this.logger.debug(
                `Saved analysis result ${index + 1}/${allQueries.length} for ${competitor.name}`,
              );
            } catch (error) {
              this.logger.error(
                `Error processing query ${index + 1} for ${competitor.name}:`,
                error,
              );
            }
          }),
        ),
      );

      this.logger.log(`Completed analysis for company: ${competitor.name}`);
    } catch (error) {
      this.logger.error(`Error seeding company ${competitor.name}:`, error);
      throw error;
    }
  }

  private countMentions(text: string, companyName: string): number {
    const regex = new RegExp(companyName, 'gi');
    return (text.match(regex) || []).length;
  }

  private generateQuestions(
    count: number,
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): Array<{ type: string; question: string }> {
    const questionTypes = [
      'market_position',
      'brand_visibility',
      'customer_perception',
      'innovation_leadership',
      'market_trends',
      'digital_presence',
      'sustainability_impact',
      'industry_influence',
    ];

    const questions: Array<{ type: string; question: string }> = [];

    // Generate 150 industry queries
    for (let i = 0; i < 150; i++) {
      const type = questionTypes[i % questionTypes.length];
      const question = this.generateQuestionByType(
        type,
        competitor,
        categoryCompetitors,
      );
      questions.push({ type: 'industry', question });
    }

    // Generate 150 context queries
    for (let i = 0; i < 150; i++) {
      const type = questionTypes[i % questionTypes.length];
      const question = this.generateContextQuestionByType(
        type,
        competitor,
        categoryCompetitors,
      );
      questions.push({ type: 'context', question });
    }

    return questions;
  }

  private generateQuestionByType(
    type: string,
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): string {
    const competitors = categoryCompetitors
      .filter(c => c.id !== competitor.id)
      .map(c => c.name)
      .join(', ');

    const templates: Record<string, string> = {
      market_position: `What is ${competitor.name}'s current market position compared to ${competitors}?`,
      brand_visibility: `How visible is ${competitor.name}'s brand presence compared to industry competitors?`,
      customer_perception: `How do customers perceive ${competitor.name} compared to alternatives?`,
      innovation_leadership: `What is ${competitor.name}'s role in driving industry innovation?`,
      market_trends: `How is ${competitor.name} adapting to current market trends?`,
      digital_presence: `Analyze ${competitor.name}'s digital presence and effectiveness.`,
      sustainability_impact: `What is ${competitor.name}'s impact on sustainability in the industry?`,
      industry_influence: `How does ${competitor.name} influence industry standards and practices?`,
    };

    return templates[type] || templates.market_position;
  }

  private generateContextQuestionByType(
    type: string,
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): string {
    const templates: Record<string, string> = {
      market_position: `What unique value does ${competitor.name} provide in the ${competitor.industry?.name || 'industry'} market?`,
      brand_visibility: `How effectively does ${competitor.name} communicate its core offerings to its target market?`,
      customer_perception: `What aspects of ${competitor.name}'s solutions resonate most with customers?`,
      innovation_leadership: `How does ${competitor.name} demonstrate innovation in its approach to ${competitor.industry?.name || 'industry'} challenges?`,
      market_trends: `How well does ${competitor.name} align with current trends in ${competitor.industry?.name || 'industry'}?`,
      digital_presence: `What distinguishes ${competitor.name}'s digital presence in the ${competitor.industry?.name || 'industry'} space?`,
      sustainability_impact: `How does ${competitor.name} approach sustainability in its business practices?`,
      industry_influence: `What unique contributions has ${competitor.name} made to industry standards?`,
    };

    return templates[type] || templates.market_position;
  }

  private calculateMetrics(
    result: string,
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): {
    visibilityScore: number;
    prominenceScore: number;
    contextScore: number;
    authorityScore: number;
    citationFrequency: number;
    categoryLeadership: number;
    competitorProximity: { closestCompetitor: string; distanceScore: number };
    knowledgeBaseMetrics: {
      coverage: number;
      depth: number;
      uniqueness: number;
    };
    trends: {
      visibilityTrend: string;
      rankingStability: number;
      competitorDynamics: string;
    };
  } {
    // Calculate visibility score (0-1)
    const visibilityScore = 0.5 + Math.random() * 0.5;

    // Calculate prominence score (0-1)
    const prominenceScore = 0.4 + Math.random() * 0.6;

    // Calculate context score (0-1)
    const contextScore = 0.3 + Math.random() * 0.7;

    // Calculate authority score (0-1)
    const authorityScore = 0.6 + Math.random() * 0.4;

    // Calculate citation frequency (0-1)
    const citationFrequency = 0.4 + Math.random() * 0.6;

    // Determine category leadership (0-1)
    const categoryLeadership = 0.4 + Math.random() * 0.6;

    // Generate competitor proximity data
    const competitorProximity = {
      closestCompetitor: categoryCompetitors[0]?.name || 'unknown',
      distanceScore: 0.75,
    };

    // Generate knowledge base metrics
    const knowledgeBaseMetrics = {
      coverage: 0.85,
      depth: 0.8,
      uniqueness: 0.75,
    };

    // Generate trends data
    const trends = {
      visibilityTrend: 'increasing',
      rankingStability: 0.9,
      competitorDynamics: 'maintaining',
    };

    return {
      visibilityScore,
      prominenceScore,
      contextScore,
      authorityScore,
      citationFrequency,
      categoryLeadership,
      competitorProximity,
      knowledgeBaseMetrics,
      trends,
    };
  }

  private extractSummary(result: string): string {
    // Extract first paragraph or up to 200 characters
    return result.split('\n')[0].substring(0, 200);
  }

  private extractKeyFindings(result: string): string[] {
    // Split by newlines and bullet points, take up to 5 key findings
    return result
      .split(/\n|•/)
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 5);
  }

  async getProgress(companyId: string): Promise<{
    company: string;
    totalEntries: number;
    targetEntries: number;
    progress: number;
  }> {
    const competitor =
      await this.customerResearchService.getCompetitorById(companyId);

    const totalEntries = await this.analyticsRepository.count({
      where: { companyId: companyId },
    });

    const targetEntries = this.configService.get('ENTRIES_PER_CUSTOMER') || 300;

    return {
      company: competitor.name,
      totalEntries,
      targetEntries,
      progress: (totalEntries / targetEntries) * 100,
    };
  }

  private generateBrandMentions(
    content: string,
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): any[] {
    const mentions = [];
    const sentences = content.split(/[.!?]+/);

    sentences.forEach((sentence, i) => {
      if (sentence.toLowerCase().includes(competitor.name.toLowerCase())) {
        mentions.push({
          id: `mention-${mentions.length}`,
          brandId: competitor.name.toLowerCase(),
          content: sentence.trim().substring(0, 50) + '...',
          position: {
            index: i * 35,
            paragraph: Math.floor(i / 3),
            isLeading: i < sentences.length * 0.3,
          },
          visibility: {
            prominence: 0.8 + Math.random() * 0.2,
            contextScore: 0.7 + Math.random() * 0.3,
            competitorProximity: categoryCompetitors
              .filter(comp => comp.id !== competitor.id)
              .map(comp => ({
                competitor: comp.name,
                distance: Math.floor(Math.random() * 10),
                relationship: Math.random() > 0.5 ? 'superior' : 'inferior',
              })),
          },
          knowledgeBaseMetrics: {
            citationFrequency: 0.7 + Math.random() * 0.3,
            authorityScore: 0.8 + Math.random() * 0.2,
            categoryLeadership: Math.random() > 0.5 ? 'dominant' : 'strong',
          },
        });
      }
    });

    return mentions;
  }

  private generateBrandHealth(
    competitor: CompetitorEntity,
    categoryCompetitors: CompetitorEntity[],
  ): any {
    return {
      visibilityMetrics: {
        overallVisibility: 0.85,
        categoryRankings: {
          'market-presence': 1,
          innovation: 2,
          'customer-satisfaction': 1,
        },
        competitorComparison: Object.fromEntries(
          categoryCompetitors
            .filter(comp => comp.id !== competitor.id)
            .map(comp => [
              comp.name.toLowerCase(),
              {
                visibility: 0.6 + Math.random() * 0.2,
                relativeDelta: 0.1 + Math.random() * 0.15,
              },
            ]),
        ),
      },
      llmPresence: {
        knowledgeBaseStrength: 0.9,
        contextualAuthority: 0.85,
        topicalLeadership: [
          'market-presence',
          'innovation',
          'customer-satisfaction',
        ],
      },
      trendsOverTime: {
        visibilityTrend: 'increasing',
        rankingStability: 0.9,
        competitorDynamics: 'maintaining',
      },
    };
  }

  async seedIndustries(): Promise<void> {
    const industries = [
      {
        name: 'Content Marketing',
        description: 'Content marketing platforms and services',
      },
      {
        name: 'Telecommunications Software',
        description: 'Software for telecom operations',
      },
      {
        name: 'Computer Hardware and Technology Solutions',
        description: 'Hardware and tech solutions',
      },
      {
        name: 'Banking and Financial Services',
        description: 'Banking and financial services',
      },
      {
        name: 'Financial Software',
        description: 'Financial software solutions',
      },
      { name: 'Used Car Retail', description: 'Used car retail and services' },
      { name: 'Digital Banking', description: 'Digital banking solutions' },
      {
        name: 'Online Payment Systems',
        description: 'Online payment solutions',
      },
      {
        name: 'Architecture and Engineering Software',
        description: 'Software for architecture and engineering',
      },
    ];

    for (const industry of industries) {
      const existingIndustry = await this.industryRepository.findOne({
        where: { name: industry.name },
      });

      if (!existingIndustry) {
        await this.industryRepository.save(industry);
      }
    }
  }

  async seedCompetitors(): Promise<void> {
    const competitors = [
      {
        name: 'Skyword',
        website: 'https://www.skyword.com',
        industryName: 'Content Marketing',
        isCustomer: true,
      },
      {
        name: 'Percolate',
        website: 'https://www.percolate.com',
        industryName: 'Content Marketing',
        isCustomer: false,
      },
      {
        name: 'NewsCred',
        website: 'https://www.newscred.com',
        industryName: 'Content Marketing',
        isCustomer: false,
      },
      {
        name: 'Kapost',
        website: 'https://www.kapost.com',
        industryName: 'Content Marketing',
        isCustomer: false,
      },
    ];

    for (const competitor of competitors) {
      const existingCompetitor = await this.competitorRepository.findOne({
        where: { name: competitor.name },
      });

      if (!existingCompetitor) {
        const industry = await this.industryRepository.findOne({
          where: { name: competitor.industryName },
        });

        if (!industry) {
          throw new Error(`Industry ${competitor.industryName} not found`);
        }

        await this.competitorRepository.save({
          ...competitor,
          industry,
        });
      }
    }
  }

  async seedInitialAnalytics(): Promise<void> {
    const skyword = await this.competitorRepository.findOne({
      where: { name: 'Skyword' },
    });

    if (!skyword) {
      throw new Error('Skyword not found');
    }

    const sampleResponses: Array<{
      query: string;
      response: string;
      type: QueryType;
    }> = [
      {
        query: 'What are the leading content marketing platforms?',
        response:
          'Skyword is among the top content marketing platforms, known for enterprise solutions...',
        type: QueryType.INDUSTRY,
      },
      {
        query: 'How does Skyword compare to other content platforms?',
        response:
          'Compared to competitors, Skyword offers strong enterprise features...',
        type: QueryType.COMPETITIVE,
      },
    ];

    for (const sample of sampleResponses) {
      const existingAnalysis = await this.analyticsRepository.findOne({
        where: {
          queryText: sample.query,
          companyId: skyword.id,
        },
      });

      if (!existingAnalysis) {
        const analyticsData: DeepPartial<AnalyticsResult> = {
          companyId: skyword.id,
          queryType: sample.type,
          queryText: sample.query,
          responseText: sample.response,
          mentionCount: 5,
          prominenceScore: 0.85,
          sentimentScore: 0.8,
          relevanceScore: 0.9,
          contextScore: 0.85,
          visibilityScore: 0.85,
          authorityScore: 0.8,
          citationFrequency: 0.75,
          categoryLeadership: '0.8',
          competitorProximity: [
            {
              competitor: 'competitor-1',
              distance: 0.75,
              relationship: 'competitor',
            },
          ],
          knowledgeBaseMetrics: {
            knowledgeBaseStrength: 0.85,
            contextualAuthority: 0.8,
            topicalLeadership: [],
          },
          trends: {
            visibilityTrend: 'increasing',
            rankingStability: 0.9,
            competitorDynamics: 'maintaining',
          },
          responseMetadata: {
            processingTime: 2000,
            confidenceScore: 0.9,
          },
          analysis: {
            question: sample.query,
            aiResponse: {
              content: sample.response,
              metadata: {
                model: 'gpt-4',
                tokens: 1000,
              },
            },
            brandHealth: {
              visibilityMetrics: {
                overallVisibility: 0.85,
                categoryRankings: {},
                competitorComparison: {},
              },
              llmPresence: {
                knowledgeBaseStrength: 0.9,
                contextualAuthority: 0.85,
                topicalLeadership: [],
              },
              trendsOverTime: {
                visibilityTrend: 'increasing',
                rankingStability: 0.9,
                competitorDynamics: 'maintaining',
              },
            },
            brandMentions: [],
          },
          metadata: {
            version: '1.0',
            batchId: new Date().toISOString(),
            queryType: sample.type,
            index: 1,
          },
        };

        await this.analyticsResultRepository.save(analyticsData);
      }
    }
  }

  async seedAnalytics(skyword: any): Promise<void> {
    const existing = await this.analyticsResultRepository.findOne({
      where: { companyId: skyword.id },
    });

    if (existing) {
      return;
    }

    const sample = this.generateSampleData();

    const analyticsData: DeepPartial<AnalyticsResult> = {
      companyId: skyword.id,
      queryType: QueryType.INDUSTRY,
      queryText: sample.query,
      responseText: sample.response,
      mentionCount: 5,
      prominenceScore: 0.85,
      sentimentScore: 0.8,
      relevanceScore: 0.9,
      contextScore: 0.85,
      visibilityScore: 0.85,
      authorityScore: 0.8,
      citationFrequency: 0.75,
      categoryLeadership: '0.8',
      competitorProximity: [
        {
          competitor: 'competitor-1',
          distance: 0.75,
          relationship: 'competitor',
        },
      ],
      knowledgeBaseMetrics: {
        knowledgeBaseStrength: 0.85,
        contextualAuthority: 0.8,
        topicalLeadership: [],
      },
      trends: {
        visibilityTrend: 'increasing',
        rankingStability: 0.9,
        competitorDynamics: 'maintaining',
      },
      responseMetadata: {
        processingTime: 1500,
        confidenceScore: 0.9,
      },
      analysis: {
        question: sample.query,
        aiResponse: {
          content: sample.response,
          metadata: {
            model: 'gpt-4',
            tokens: 1000,
          },
        },
        brandHealth: {
          visibilityMetrics: {
            overallVisibility: 0.85,
            categoryRankings: {},
            competitorComparison: {},
          },
          llmPresence: {
            knowledgeBaseStrength: 0.9,
            contextualAuthority: 0.85,
            topicalLeadership: [],
          },
          trendsOverTime: {
            visibilityTrend: 'increasing',
            rankingStability: 0.9,
            competitorDynamics: 'maintaining',
          },
        },
        brandMentions: [],
      },
      metadata: {
        version: '1.0',
        batchId: new Date().toISOString(),
        queryType: QueryType.INDUSTRY,
        index: 1,
      },
    };

    await this.analyticsResultRepository.save(analyticsData);
  }

  private generateSampleData() {
    return {
      query: "What is Skyword's market position in content marketing?",
      response: 'Skyword is a leading enterprise content marketing platform...',
    };
  }

  async seedSampleData(): Promise<void> {
    const existingAnalytics = await this.analyticsResultRepository.findOne({
      where: { companyId: 'sample-company-1' },
    });

    if (!existingAnalytics) {
      const sampleData: DeepPartial<AnalyticsResult> = {
        companyId: 'sample-company-1',
        queryType: QueryType.INDUSTRY,
        queryText: 'What are the key trends in sustainable energy?',
        responseText: 'The key trends in sustainable energy include...',
        mentionCount: 15,
        prominenceScore: 0.85,
        sentimentScore: 0.75,
        relevanceScore: 0.9,
        contextScore: 0.8,
        visibilityScore: 0.7,
        authorityScore: 0.85,
        citationFrequency: 0.75,
        categoryLeadership: '0.8',
        competitorProximity: [
          {
            competitor: 'competitor-1',
            distance: 0.75,
            relationship: 'competitor',
          },
        ],
        knowledgeBaseMetrics: {
          knowledgeBaseStrength: 0.85,
          contextualAuthority: 0.8,
          topicalLeadership: [],
        },
        trends: {
          visibilityTrend: 'increasing',
          rankingStability: 0.9,
          competitorDynamics: 'maintaining',
        },
        responseMetadata: {
          processingTime: 1500,
          confidenceScore: 0.9,
        },
        analysis: {
          question: 'What are the key trends in sustainable energy?',
          aiResponse: {
            content: 'The key trends in sustainable energy include...',
            metadata: {
              model: 'gpt-4',
              tokens: 1000,
            },
          },
          brandHealth: {
            visibilityMetrics: {
              overallVisibility: 0.85,
              categoryRankings: {},
              competitorComparison: {},
            },
            llmPresence: {
              knowledgeBaseStrength: 0.9,
              contextualAuthority: 0.85,
              topicalLeadership: [],
            },
            trendsOverTime: {
              visibilityTrend: 'increasing',
              rankingStability: 0.9,
              competitorDynamics: 'maintaining',
            },
          },
          brandMentions: [],
        },
        metadata: {
          version: '1.0',
          batchId: new Date().toISOString(),
          queryType: QueryType.INDUSTRY,
          index: 1,
        },
      };

      await this.analyticsResultRepository.save(sampleData);
    }
  }
}
