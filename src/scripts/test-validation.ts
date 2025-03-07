import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { QueryValidationService } from '../analytics/services/query-validation.service';
import { QueryTemplate } from '../analytics/types/query.types';
import { queryTemplates } from './seed-data/query-templates';
import { Logger } from '@nestjs/common';

async function testValidation() {
  const logger = new Logger('ValidationTest');
  const app = await NestFactory.createApplicationContext(AppModule);
  const validationService = app.get(QueryValidationService);

  try {
    logger.log('Starting validation tests...\n');

    // Test cases for queries
    const queryTestCases = [
      {
        description: 'Valid industry query',
        query: 'Who are the leading providers of content marketing platform in digital marketing?',
        template: queryTemplates[0], // industry discovery template
        expectedValid: true
      },
      {
        description: 'Invalid industry query (missing solution_type)',
        query: 'Who are the leading providers in digital marketing?',
        template: queryTemplates[0],
        expectedValid: false
      },
      {
        description: 'Invalid industry query (contains forbidden word)',
        query: 'Who are the innovative providers of content marketing platform in digital marketing?',
        template: queryTemplates[0],
        expectedValid: false
      }
    ];

    // Test cases for responses
    const responseTestCases = [
      {
        description: 'Valid industry response with facts and metrics',
        response: `In the content marketing platform space, Contently and Skyword are major players, with Contently holding approximately 25% market share. NewsCred has established a strong presence since 2012, particularly in enterprise solutions. HubSpot's platform serves over 100,000 customers across different segments.`,
        template: queryTemplates[0],
        expectedValid: true
      },
      {
        description: 'Invalid response (speculative language)',
        response: `Contently might be leading the market, and it could potentially have good market share. It seems that they might be doing well in the enterprise segment.`,
        template: queryTemplates[0],
        expectedValid: false
      },
      {
        description: 'Invalid response (future tense)',
        response: `Contently will be expanding their platform next year. They are planning to add new features and will focus on AI capabilities.`,
        template: queryTemplates[0],
        expectedValid: false
      },
      {
        description: 'Valid context response with differentiation',
        response: `Contently differentiates its content marketing platform through AI-powered analytics, serving enterprise clients with specific features like brand voice analysis and ROI tracking. Their platform demonstrates superior content quality control through a unique three-step review process, specifically designed for large marketing teams.`,
        template: queryTemplates[2], // context differentiation template
        expectedValid: true
      },
      {
        description: 'Invalid context response (subjective opinions)',
        response: `I think Contently has a great platform. It seems to be working well, and it appears that customers like it.`,
        template: queryTemplates[2],
        expectedValid: false
      }
    ];

    // Run query validation tests
    logger.log('Testing Query Validation:');
    for (const testCase of queryTestCases) {
      const result = validationService.validateQuery(testCase.query, testCase.template);
      const passed = result.isValid === testCase.expectedValid;

      logger.log(`\nTest: ${testCase.description}`);
      logger.log(`Query: "${testCase.query}"`);
      logger.log(`Expected valid: ${testCase.expectedValid}`);
      logger.log(`Actual valid: ${result.isValid}`);
      if (result.errors.length > 0) {
        logger.log('Errors:', result.errors);
      }
      logger.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    }

    // Run response validation tests
    logger.log('\nTesting Response Validation:');
    for (const testCase of responseTestCases) {
      const result = validationService.validateResponse(testCase.response, testCase.template);
      const passed = result.isValid === testCase.expectedValid;

      logger.log(`\nTest: ${testCase.description}`);
      logger.log(`Response: "${testCase.response}"`);
      logger.log(`Expected valid: ${testCase.expectedValid}`);
      logger.log(`Actual valid: ${result.isValid}`);
      logger.log(`Quality Score: ${result.qualityScore}`);
      logger.log('Quality Metrics:', result.metrics);
      if (result.errors.length > 0) {
        logger.log('Errors:', result.errors);
      }
      logger.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
    }

    // Test edge cases
    logger.log('\nTesting Edge Cases:');
    
    // Empty response
    const emptyResult = validationService.validateResponse('', queryTemplates[0]);
    logger.log('\nTest: Empty response');
    logger.log(`Valid: ${emptyResult.isValid}`);
    logger.log('Errors:', emptyResult.errors);

    // Very long response
    const longResponse = 'Content marketing '.repeat(1000);
    const longResult = validationService.validateResponse(longResponse, queryTemplates[0]);
    logger.log('\nTest: Very long response');
    logger.log(`Valid: ${longResult.isValid}`);
    logger.log('Errors:', longResult.errors);

    // Response with mixed valid/invalid content
    const mixedResponse = `Contently leads the market with 30% share (fact), but they might expand soon (speculation). According to recent data, they serve 500 enterprise clients (reference), though I think they're doing great (opinion).`;
    const mixedResult = validationService.validateResponse(mixedResponse, queryTemplates[0]);
    logger.log('\nTest: Mixed valid/invalid content');
    logger.log(`Valid: ${mixedResult.isValid}`);
    logger.log(`Quality Score: ${mixedResult.qualityScore}`);
    logger.log('Errors:', mixedResult.errors);

    logger.log('\nValidation tests completed.');
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

// Run the test
testValidation()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 