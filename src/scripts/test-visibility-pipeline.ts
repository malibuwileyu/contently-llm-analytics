import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { VisibilityAnalyticsService } from '../analytics/services/visibility-analytics.service';
import { ContextQueryService } from '../analytics/services/context-query.service';
import { CompetitorAnalysisService } from '../analytics/services/competitor-analysis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';
import { Logger } from '@nestjs/common';
import * as path from 'path';
import { FEATURE_FLAGS } from '../config/typeorm.config';

async function testVisibilityPipeline() {
  const logger = new Logger('VisibilityPipelineTest');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const visibilityAnalyticsService = app.get(VisibilityAnalyticsService);
    const contextQueryService = app.get(ContextQueryService);
    const competitorService = app.get(CompetitorAnalysisService);
    const competitorRepo = app.get(
      'CompetitorEntityRepository',
    ) as Repository<CompetitorEntity>;
    const industryRepo = app.get(
      'IndustryEntityRepository',
    ) as Repository<IndustryEntity>;

    // Seed test data
    logger.log('Seeding test data...');

    // Find or create industry
    let industry = await industryRepo.findOne({
      where: { name: 'Content Marketing' },
    });

    if (!industry) {
      industry = await industryRepo.save({
        name: 'Content Marketing',
        description: 'Content marketing platforms and services',
        market_size: 1000000000,
        growth_rate: 15.5,
        key_trends: ['AI Integration', 'Personalization', 'Analytics'],
      });
    }

    // Find or create company
    let company = await competitorRepo.findOne({
      where: { name: 'Skyword' },
    });

    if (!company) {
      company = await competitorRepo.save({
        name: 'Skyword',
        website: 'https://www.skyword.com',
        description: 'Enterprise content marketing platform',
        industry: industry,
        market_share: 12.5,
        annual_revenue: 50000000,
        employee_count: 250,
        founded_year: 2010,
        headquarters: 'Boston, MA',
        key_products: [
          'Content Marketing Platform',
          'Content Strategy',
          'Content Analytics',
        ],
      });
    }

    if (!company) {
      throw new Error('Failed to seed test company data');
    }

    logger.log('Starting visibility pipeline test...');
    logger.log(`Testing for company: ${company.name}`);

    // Test 1: Generate queries for each type
    logger.log('\nTest 1: Query Generation');
    const queryConfig = {
      industryQueriesCount: 10,
      contextQueriesCount: 5,
      competitiveQueriesCount: 5,
    };

    const queries = await contextQueryService.generateQueriesForCompany(
      company,
      queryConfig,
    );

    logger.log('Generated Queries:');
    Object.entries(queries).forEach(([type, typeQueries]) => {
      if (type === 'competitive') return;
      logger.log(`\n${type.toUpperCase()} Queries:`);
      typeQueries.forEach((q, i) => logger.log(`${i + 1}. ${q}`));
    });

    // Test 2: Process each query type
    logger.log('\nTest 2: Query Processing');
    const testResponses = {
      industry: [
        "Content marketing platforms have evolved significantly, with leading solutions offering integrated analytics and AI capabilities. Skyword stands out for its enterprise-focused approach and emphasis on high-quality content creation. Other notable platforms include NewsCred's integrated marketing platform and Contently's data-driven content strategy tools. The market shows a clear trend towards comprehensive solutions that combine content creation, workflow management, and performance analytics.",
        "In the content marketing space, several providers excel at different aspects. Skyword's strength lies in its enterprise content creation and distribution capabilities, while Percolate focuses more on planning and collaboration features. HubSpot offers a more integrated marketing approach, though it's not solely focused on content marketing. The industry is seeing increased demand for AI-powered content optimization and multi-channel distribution capabilities.",
      ],
      context: [
        "Enterprise content marketing platforms are increasingly incorporating AI and machine learning capabilities. Skyword's platform leverages advanced analytics for content optimization, competing with newer AI-driven solutions. Their focus on enterprise-scale content operations sets them apart, though companies like Contently and NewsCred also offer robust enterprise features. The market is moving towards more automated, data-driven content creation and distribution processes.",
        "The adoption of content marketing platforms in enterprise environments shows varying approaches to implementation. Skyword's methodology emphasizes quality content creation with built-in governance, while some competitors focus more on volume and automation. Their technology stack, particularly in content analytics and workflow automation, aligns well with enterprise needs, though some newer platforms offer more advanced AI features.",
      ],
    };

    const results = [];
    for (const [type, responses] of Object.entries(testResponses)) {
      if (type === 'competitive') continue;

      logger.log(`\nProcessing ${type} queries...`);
      for (const [i, response] of responses.entries()) {
        const query = queries[type][i];
        logger.log(`\nQuery ${i + 1}: ${query}`);
        logger.log(`Response: ${response.substring(0, 100)}...`);

        const result = await visibilityAnalyticsService.processQueryResponse(
          company,
          type as any,
          query,
          response,
        );

        results.push(result);
        logger.log('Metrics:', {
          mentionCount: result.mentionCount,
          prominenceScore: result.prominenceScore,
          sentimentScore: result.sentimentScore,
          relevanceScore: result.relevanceScore,
          contextScore: result.contextScore,
          visibilityScore: result.visibilityScore,
          authorityScore: result.authorityScore,
        });

        if (result.knowledgeBaseMetrics) {
          logger.log('Knowledge Base Metrics:', result.knowledgeBaseMetrics);
        }
      }
    }

    // Test 3: Trend Analysis
    logger.log('\nTest 3: Trend Analysis');
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trends = await visibilityAnalyticsService.getVisibilityTrends(
      company,
      {
        start: weekAgo,
        end: now,
      },
    );

    logger.log('Visibility Trends:', trends);

    // Export results to file
    const outputPath = path.join(
      __dirname,
      '../../visibility-test-results.json',
    );
    await visibilityAnalyticsService.exportAnalyticsToFile(
      company,
      { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() },
      outputPath,
    );
    logger.log(`\nTest results exported to: ${outputPath}`);

    logger.log('\nVisibility Pipeline Test Completed Successfully');
    return { success: true, results };
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the test
testVisibilityPipeline()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
