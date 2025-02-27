import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create a data source for testing data insertion
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.SUPABASE_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'postgres',
  schema: process.env.DB_SCHEMA || 'public',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  synchronize: false,
  logging: true,
});

// Test data insertion
async function testDataInsertion() {
  try {
    await dataSource.initialize();
    console.log('Data Source has been initialized');
    
    // Generate a test brand ID
    const brandId = uuidv4();
    console.log(`Generated brand ID: ${brandId}`);
    
    // Insert a brand mention
    console.log('\nInserting brand mention:');
    const brandMentionResult = await dataSource.query(`
      INSERT INTO brand_mention (
        brand_id, 
        content, 
        sentiment, 
        magnitude, 
        context, 
        mentioned_at, 
        created_at, 
        updated_at
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        $6, 
        NOW(), 
        NOW()
      ) RETURNING id
    `, [
      brandId,
      'This is a test brand mention for testing the migration',
      0.75,
      0.5,
      JSON.stringify({ query: 'test query', response: 'test response', platform: 'test platform' }),
      new Date()
    ]);
    
    const brandMentionId = brandMentionResult[0].id;
    console.log(`Inserted brand mention with ID: ${brandMentionId}`);
    
    // Insert a citation
    console.log('\nInserting citation:');
    const citationResult = await dataSource.query(`
      INSERT INTO citation (
        brand_mention_id, 
        source, 
        text, 
        authority, 
        metadata, 
        created_at, 
        updated_at
      ) VALUES (
        $1, 
        $2, 
        $3, 
        $4, 
        $5, 
        NOW(), 
        NOW()
      ) RETURNING id
    `, [
      brandMentionId,
      'https://example.com',
      'This is a test citation text',
      0.85,
      JSON.stringify({ page: 1, section: 'Introduction' })
    ]);
    
    const citationId = citationResult[0].id;
    console.log(`Inserted citation with ID: ${citationId}`);
    
    // Query the data to verify it was inserted correctly
    console.log('\nQuerying brand mention:');
    const brandMention = await dataSource.query(`
      SELECT * FROM brand_mention WHERE id = $1
    `, [brandMentionId]);
    
    console.log('Brand mention data:');
    console.log(brandMention[0]);
    
    console.log('\nQuerying citation:');
    const citation = await dataSource.query(`
      SELECT * FROM citation WHERE id = $1
    `, [citationId]);
    
    console.log('Citation data:');
    console.log(citation[0]);
    
    // Query with a join to verify the relationship
    console.log('\nQuerying with join:');
    const joinResult = await dataSource.query(`
      SELECT 
        bm.id as brand_mention_id, 
        bm.content, 
        bm.sentiment, 
        c.id as citation_id, 
        c.source, 
        c.authority
      FROM brand_mention bm
      JOIN citation c ON c.brand_mention_id = bm.id
      WHERE bm.id = $1
    `, [brandMentionId]);
    
    console.log('Join result:');
    console.log(joinResult[0]);
    
    // Clean up the test data
    console.log('\nCleaning up test data:');
    await dataSource.query(`
      DELETE FROM citation WHERE id = $1
    `, [citationId]);
    console.log(`Deleted citation with ID: ${citationId}`);
    
    await dataSource.query(`
      DELETE FROM brand_mention WHERE id = $1
    `, [brandMentionId]);
    console.log(`Deleted brand mention with ID: ${brandMentionId}`);
    
    await dataSource.destroy();
    console.log('\nData Source has been closed');
    
    console.log('\nTest completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error testing data insertion:', error);
    process.exit(1);
  }
}

testDataInsertion(); 