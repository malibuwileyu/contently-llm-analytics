import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkSchema() {
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
    
    // Get all tables in the public schema
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('Available tables:');
    tables.forEach((table: any) => {
      console.log(`- ${table.table_name}`);
    });

  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the check
checkSchema().catch(console.error); 