import { jest } from '@jest/globals';
import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '../.env.test') });

// Set default test timeout
jest.setTimeout(60000);
