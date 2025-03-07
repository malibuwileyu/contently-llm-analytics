import { Client } from 'pg';
import { config } from 'dotenv';

// Load environment variables
config();

async function verifyData() {
  const password = process.env.DB_PASSWORD || 'm94rblspnztiCviL';
  const username = process.env.DB_USERNAME || 'postgres.bbsgwltocnbqalptlchw';
  const host = process.env.DB_HOST || 'aws-0-us-west-1.pooler.supabase.com';
  const port = parseInt(process.env.DB_PORT || '6543', 10);
  const database = process.env.DB_NAME || 'postgres';

  const client = new Client({
    user: username,
    password: password,
    host: host,
    port: port,
    database: database,
    ssl: {
      rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000,
    query_timeout: 30000,
    statement_timeout: 30000
  });

  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get all business categories
    const categoriesResult = await client.query(`
      SELECT id, name, description, keywords
      FROM business_categories 
      ORDER BY name;
    `);
    
    console.log('Business Categories:', categoriesResult.rows.length);
    for (const category of categoriesResult.rows) {
      console.log(`\n${category.name}:`);
      
      // Get competitors for this category
      const competitorsResult = await client.query(`
        SELECT name, website, "isCustomer"
        FROM competitors 
        WHERE "businessCategoryId" = $1
        ORDER BY "isCustomer" DESC, name;
      `, [category.id]);
      
      console.log('  Competitors:');
      for (const comp of competitorsResult.rows) {
        console.log(`    ${comp.isCustomer ? '* ' : '- '}${comp.name} (${comp.website})`);
      }
    }

  } catch (error) {
    console.error('Error verifying data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run verification
verifyData().catch(console.error); 