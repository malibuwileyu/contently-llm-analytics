import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AIProviderModule } from '../modules/ai-provider/ai-provider.module';
import { TypeOrmConfigService } from '../config/typeorm.config';
import { User } from '../auth/entities/user.entity';
import { Company } from '../analytics/entities/company.entity';

async function runTests() {
  let module = null;
  try {
    console.log('Starting AI Provider Integration Tests...\n');

    // Load test file
    const testFile = path.join(
      __dirname,
      '../tests/integration/ai-provider.integration.spec.ts',
    );
    await import(testFile);

    console.log('\nTests completed successfully!');
    console.log('Check the test-outputs directory for results.');
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  } finally {
    if (module) {
      const connection = module.get('Connection');
      if (connection && connection.isConnected) {
        await connection.close();
      }
      await module.close();
    }
  }
}

// Run the tests
runTests();
