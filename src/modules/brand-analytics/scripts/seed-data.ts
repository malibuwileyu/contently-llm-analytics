/**
 * Seed script for Brand Analytics module
 * This script populates the database with initial data for the Brand Analytics module
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../../app.module';
import { Connection } from 'typeorm';
import { BusinessCategoryEntity } from '../entities/business-category.entity';
import { CompetitorEntity } from '../entities/competitor.entity';
import { QueryEntity } from '../entities/query.entity';
import { QueryTemplateEntity } from '../entities/query-template.entity';
import {
  _businessCategories,
  getFlattenedBusinessCategories,
  competitors,
  getAllCompetitors,
  generatedQueries,
} from '../data';

// If the entity imports are causing _errors, we can define interfaces to use instead
// These should match the structure of the actual entities
interface IBusinessCategory {
  id?: number;
  name: string;
  description: string;
  keywords: string[];
  synonyms: string[];
  parentCategory?: IBusinessCategory;
}

interface ICompetitor {
  id?: number;
  name: string;
  description: string;
  website: string;
  businessCategory: IBusinessCategory;
  marketShare?: number;
  founded?: number;
  headquarters?: string;
  keyProducts?: string[];
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface IQuery {
  id?: number;
  text: string;
  type: string;
  createdAt: Date;
  businessCategory?: IBusinessCategory;
  competitors?: ICompetitor[];
}

async function bootstrap() {
  const logger = new Logger('SeedScript');
  logger.log('Starting seed script for Brand Analytics module...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get(Connection);

  try {
    // Clear existing data
    logger.log('Clearing existing data...');
    await connection.createQueryBuilder().delete().from(QueryEntity).execute();
    await connection
      .createQueryBuilder()
      .delete()
      .from(CompetitorEntity)
      .execute();
    await connection
      .createQueryBuilder()
      .delete()
      .from(BusinessCategoryEntity)
      .execute();

    // Seed business categories
    logger.log('Seeding business categories...');
    const flattenedCategories = getFlattenedBusinessCategories();
    const categoryMap = new Map<string, BusinessCategoryEntity>();

    // First pass: Create all categories
    for (const categoryData of flattenedCategories) {
      const category = new BusinessCategoryEntity();
      category.name = categoryData.name;
      category.description = categoryData.description;
      category.keywords = categoryData.keywords;
      category.synonyms = categoryData.synonyms;
      category.isActive = true;

      const savedCategory = await connection.manager.save(category);
      categoryMap.set(savedCategory.name, savedCategory);
    }

    // Second pass: Set parent relationships
    for (const categoryData of flattenedCategories) {
      if (categoryData.parentCategory) {
        const category = categoryMap.get(categoryData.name);
        const parentCategory = categoryMap.get(categoryData.parentCategory);

        if (category && parentCategory) {
          category.parentCategory = parentCategory;
          await connection.manager.save(category);
        }
      }
    }

    // Seed competitors
    logger.log('Seeding competitors...');
    const allCompetitors = getAllCompetitors();

    for (const competitorData of allCompetitors) {
      const category = categoryMap.get(competitorData.businessCategory);

      if (category) {
        const competitor = new CompetitorEntity();
        competitor.name = competitorData.name;
        competitor.description = competitorData.description;
        competitor.website = competitorData.website;
        competitor.businessCategory = category;
        competitor.businessCategoryId = category.id;

        // Map additional fields to entity structure
        competitor.alternateNames = [];
        competitor.keywords = competitorData.keyProducts || [];
        competitor.products = competitorData.keyProducts || [];
        competitor.isCustomer = false;
        competitor.isActive = true;

        await connection.manager.save(competitor);
      }
    }

    // Seed query templates first
    logger.log('Seeding query templates...');
    const templateMap = new Map<string, QueryTemplateEntity>();

    // Create a basic template for each query type
    const queryTypes = [
      'general',
      'comparison',
      'recommendation',
      'feature',
      'price',
      'location',
    ];

    // Get a default category for templates
    const defaultCategory = Array.from(categoryMap.values())[0];

    for (const type of queryTypes) {
      const template = new QueryTemplateEntity();
      template.template = `{${type}_query}`;
      template.type = type;
      template.placeholders = { [`${type}_query`]: [`Sample ${type} query`] };
      template.requiredPlaceholders = [`${type}_query`];
      template.priority = 1;
      template.isActive = true;
      template.businessCategoryId = defaultCategory.id;
      template.businessCategory = defaultCategory;

      const savedTemplate = await connection.manager.save(template);
      templateMap.set(type, savedTemplate);
    }

    // Seed queries
    logger.log('Seeding generated queries...');
    for (const queryData of generatedQueries) {
      const query = new QueryEntity();
      query.text = queryData.text;
      query.status = 'completed';
      query.placeholderValues = {};
      query.metadata = {
        businessCategory: queryData.businessCategory,
        competitors: queryData.competitors,
        features: queryData.features,
      };

      // Link to query template if available
      const template = templateMap.get(queryData.type);
      if (template) {
        query.queryTemplate = template;
        query.queryTemplateId = template.id;
      }

      // Set other required fields
      query.retryCount = 0;
      query.createdAt = queryData.createdAt;

      await connection.manager.save(query);
    }

    logger.log('Seed script completed successfully!');
  } catch (error) {
    logger.error('Error during seed _process:', error);
  } finally {
    await app.close();
  }
}

// Run the seed script
bootstrap();
