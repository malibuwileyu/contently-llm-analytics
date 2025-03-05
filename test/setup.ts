import { config } from 'dotenv';

// Load environment variables from .env.test file
config({ path: '.env.test' });

// Increase timeout for all tests
jest.setTimeout(120000); // 2 minutes timeout
