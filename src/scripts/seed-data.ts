import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { businessCategories } from './seed-data/categories';
import { queryTemplates } from './seed-data/query-templates';
import { QueryTemplateEntity } from '../analytics/entities/query-template.entity';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';

// Load environment variables
config();

async function seedData() {
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
    entities: [QueryTemplateEntity, CompetitorEntity, IndustryEntity],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Seed business categories and competitors
    for (const categoryData of businessCategories) {
      const { category, competitors } = categoryData;

      // Check if category already exists
      const existingCategory = await dataSource.query(
        'SELECT id FROM public.business_categories WHERE name = $1',
        [category.name],
      );

      let categoryId;
      if (existingCategory.length === 0) {
        // Insert new category
        const result = await dataSource.query(
          `INSERT INTO public.business_categories (
            id,
            name, 
            description, 
            keywords,
            synonyms,
            is_active,
            created_at,
            updated_at
          )
          VALUES (uuid_generate_v4(), $1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id`,
          [
            category.name,
            category.description,
            category.keywords,
            category.synonyms || [],
          ],
        );
        categoryId = result[0].id;
        console.log(`Created business category: ${category.name}`);
      } else {
        categoryId = existingCategory[0].id;
        console.log(`Business category already exists: ${category.name}`);
      }

      // Seed competitors for this category
      for (const competitor of competitors) {
        // Check if competitor already exists
        const existingCompetitor = await dataSource.query(
          'SELECT id FROM public.competitors WHERE name = $1',
          [competitor.name],
        );

        if (existingCompetitor.length === 0) {
          // Insert new competitor
          await dataSource.query(
            `INSERT INTO public.competitors (
              id,
              name, 
              description, 
              website,
              business_category_id,
              is_customer,
              is_active,
              created_at,
              updated_at
            )
            VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [
              competitor.name,
              competitor.description,
              competitor.website,
              categoryId,
              competitor.isCustomer,
            ],
          );
          console.log(`Created competitor: ${competitor.name}`);
        } else {
          console.log(`Competitor already exists: ${competitor.name}`);
        }
      }
    }

    // Seed query templates
    const queryTemplateRepo = dataSource.getRepository(QueryTemplateEntity);

    for (const template of queryTemplates) {
      // Check if template already exists
      const existingTemplate = await queryTemplateRepo.findOne({
        where: {
          type: template.type,
          template: template.template,
        },
      });

      if (!existingTemplate) {
        const newTemplate = new QueryTemplateEntity();
        Object.assign(newTemplate, {
          ...template,
          isActive: true,
          priority: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await queryTemplateRepo.save(newTemplate);
        console.log(`Created query template: ${template.template}`);
      } else {
        console.log(`Query template already exists: ${template.template}`);
      }
    }

    console.log('Seeding completed successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Only run if executed directly
if (require.main === module) {
  seedData()
    .then(() => {
      console.log('Seeding script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding script failed:', error);
      process.exit(1);
    });
}
