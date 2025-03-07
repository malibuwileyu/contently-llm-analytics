import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkExistingData() {
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
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    
    // Check companies
    const companies = await dataSource.query(`
      SELECT id, name, settings 
      FROM companies 
      ORDER BY name;
    `);
    
    console.log('\nExisting Companies:');
    console.log(JSON.stringify(companies, null, 2));

    // Check business categories
    const categories = await dataSource.query(`
      SELECT id, name, description, keywords
      FROM business_categories 
      ORDER BY name;
    `);
    
    console.log('\nExisting Business Categories:');
    console.log(JSON.stringify(categories, null, 2));

    // Check competitors with correct column name
    const competitors = await dataSource.query(`
      SELECT id, name, description, website, "isCustomer", "businessCategoryId"
      FROM competitors 
      ORDER BY name;
    `);
    
    console.log('\nExisting Competitors:');
    console.log(JSON.stringify(competitors, null, 2));

    // Check table structure
    console.log('\nTable Structures:');
    
    const tableStructures = await dataSource.query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name IN ('companies', 'business_categories', 'competitors')
      ORDER BY table_name, ordinal_position;
    `);

    console.log(JSON.stringify(tableStructures, null, 2));

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the check
checkExistingData().catch(console.error); 