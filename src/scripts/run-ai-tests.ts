import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AIProviderModule } from '../modules/ai-provider/ai-provider.module';
import { CompanyEntity } from '../analytics/entities/company.entity';
import { UserEntity } from '../auth/entities/user.entity';

async function runTests() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot(),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: async () => ({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          entities: [CompanyEntity, UserEntity],
          synchronize: false,
          ssl: {
            rejectUnauthorized: false
          }
        }),
      }),
      AIProviderModule,
      TypeOrmModule.forFeature([CompanyEntity, UserEntity]),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  // Run your tests here
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
    console.error('Test error:', error);
  } finally {
    await app.close();
  }
}

runTests().catch(console.error);
