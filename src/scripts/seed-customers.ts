import { DataSource } from 'typeorm';
import { IndustryEntity } from '../modules/brand-analytics/entities/industry.entity';
import { CompetitorEntity } from '../modules/brand-analytics/entities/competitor.entity';
import { QueryTemplateEntity } from '../modules/brand-analytics/entities/query-template.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface CustomerData {
  name: string;
  website: string;
  industryName: string;
  description: string;
  competitors: string[];
}

const customers: CustomerData[] = [
  {
    name: 'Alpha.school',
    website: 'alpha.school',
    industryName: 'Education Technology',
    description: 'Alpha School offers an AI-powered 2-hour learning model in Austin, TX and Miami, FL, empowering children to excel academically while developing real-world skills and passions.',
    competitors: ['Texas Private Schools', 'West Texas schools', 'Other AI-powered education platforms']
  },
  {
    name: 'Contently',
    website: 'contently.com',
    industryName: 'Content Marketing Platform',
    description: 'Contently is a content marketing SaaS platform and services company that provides tools for content creation, strategy, and analytics, as well as a creative marketplace for scaling content production.',
    competitors: ['DivvyHQ', 'Skyword', 'Percolate', 'NewsCred', 'Kapost']
  },
  {
    name: 'Totogi',
    website: 'totogi.com',
    industryName: 'Telecommunications Software',
    description: 'Totogi is a multi-tenant, SaaS monetization platform for the telecommunications industry, providing software solutions for mobile network operators.',
    competitors: ['Cinarra Systems', 'Skyrise Intelligence', 'HubSpot Marketing Hub', 'Salesforce Marketing Cloud Account Engagement', 'Demandbase One']
  },
  {
    name: 'Dell',
    website: 'dell.com',
    industryName: 'Computer Hardware and Technology Solutions',
    description: 'Dell Technologies is a multinational technology company that develops, sells, repairs, and supports computers and related products and services.',
    competitors: ['HP', 'Lenovo', 'Apple', 'Acer', 'ASUS']
  },
  {
    name: 'CIBC',
    website: 'cibc.com',
    industryName: 'Banking and Financial Services',
    description: 'Canadian Imperial Bank of Commerce (CIBC) is a multinational banking and financial services corporation headquartered in Toronto, Ontario.',
    competitors: ['Royal Bank of Canada (RBC)', 'Toronto-Dominion Bank (TD)', 'Bank of Montreal (BMO)', 'Scotiabank', 'National Bank of Canada']
  },
  {
    name: 'Intuit',
    website: 'intuit.com',
    industryName: 'Financial Software',
    description: 'Intuit is a financial software company that produces tax preparation and accounting software for small businesses, accountants, and individuals.',
    competitors: ['H&R Block', 'TaxAct', 'FreshBooks', 'Xero', 'Wave Financial']
  },
  {
    name: 'CarMax',
    website: 'carmax.com',
    industryName: 'Used Car Retail',
    description: 'CarMax is the largest used-car retailer in the United States, known for its no-haggle prices and customer-friendly buying experience.',
    competitors: ['Carvana', 'AutoNation', 'Vroom', 'Shift', 'DriveTime']
  },
  {
    name: 'Chime Financial',
    website: 'chime.com',
    industryName: 'Digital Banking',
    description: 'Chime is a financial technology company that provides fee-free mobile banking services.',
    competitors: ['N26', 'Revolut', 'Monzo', 'Varo', 'Current']
  },
  {
    name: 'PayPal',
    website: 'paypal.com',
    industryName: 'Online Payment Systems',
    description: 'PayPal is a digital payment company operating an online payments system in the majority of countries that support online money transfers.',
    competitors: ['Stripe', 'Square', 'Venmo', 'Google Pay', 'Apple Pay']
  },
  {
    name: 'Autodesk',
    website: 'autodesk.com',
    industryName: 'Architecture and Engineering Software',
    description: 'Autodesk is a multinational software corporation that makes software products and services for the architecture, engineering, construction, manufacturing, media, education, and entertainment industries.',
    competitors: ['Dassault Systèmes', 'PTC', 'Trimble', 'Bentley Systems', 'Nemetschek']
  }
];

async function seedCustomers() {
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
    entities: [IndustryEntity, CompetitorEntity, QueryTemplateEntity],
    synchronize: false,
    logging: true
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    for (const customer of customers) {
      // Find or create industry
      let industry = await dataSource.getRepository(IndustryEntity).findOne({
        where: { name: customer.industryName }
      });

      if (!industry) {
        industry = await dataSource.getRepository(IndustryEntity).save({
          name: customer.industryName,
          description: `Industry category for ${customer.industryName}`,
          keywords: [customer.industryName.toLowerCase()],
          synonyms: [],
          isActive: true
        });
        console.log(`Created new industry: ${customer.industryName}`);
      }

      // Check if customer already exists
      const existingCustomer = await dataSource.getRepository(CompetitorEntity).findOne({
        where: { name: customer.name }
      });

      if (!existingCustomer) {
        // Create customer
        await dataSource.getRepository(CompetitorEntity).save({
          name: customer.name,
          website: customer.website,
          description: customer.description,
          industryId: industry.id,
          isCustomer: true,
          isActive: true,
          keywords: [],
          synonyms: [],
          settings: {}
        });
        console.log(`Created customer: ${customer.name}`);

        // Create competitors
        for (const competitorName of customer.competitors) {
          const existingCompetitor = await dataSource.getRepository(CompetitorEntity).findOne({
            where: { name: competitorName }
          });

          if (!existingCompetitor) {
            await dataSource.getRepository(CompetitorEntity).save({
              name: competitorName,
              industryId: industry.id,
              isCustomer: false,
              isActive: true,
              keywords: [],
              synonyms: [],
              settings: {}
            });
            console.log(`Created competitor: ${competitorName}`);
          }
        }
      } else {
        // Update existing customer with industry
        await dataSource.getRepository(CompetitorEntity).update(
          { id: existingCustomer.id },
          { 
            industryId: industry.id,
            description: customer.description,
            website: customer.website
          }
        );
        console.log(`Updated customer: ${customer.name}`);
      }
    }

    console.log('Customer seeding completed successfully');
  } catch (error) {
    console.error('Error seeding customers:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedCustomers().catch(console.error); 