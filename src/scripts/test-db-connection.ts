import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function testConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured');
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    },
    entities: [],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    // Test a simple query
    const result = await dataSource.query('SELECT NOW()');
    console.log('Query result:', result);

    return { success: true };
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run the test
testConnection()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 