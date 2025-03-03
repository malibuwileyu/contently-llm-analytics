// Test file for checking if the lint fix script works correctly
import { Module } from '@nestjs/common';

@Module({
  imports: [TestModule],
  controllers: [TestController],
  providers: [TestService],
  exports: [TestService],
})
export class TestModule {}

const config = {
  useValue: { test: true },
  useFactory: () => ({ test: true }),
  inject: [TestService],
  driver: 'test',
  autoSchemaFile: 'test.gql',
  sortSchema: true,
  playground: true,
  ssl: { rejectUnauthorized: false },
  entities: ['*.entity.ts'],
  prefix: 'test_',
  endpoint: '/test',
  load: [() => ({})],
  buckets: [0.001, 0.005, 0.01],
  verified: true,
  results: [
    { title: 'Test', snippet: 'Test snippet', url: 'https://test.com' },
  ],
};

// Some numeric values that should not get underscores
const values = {
  score: 0.85,
  threshold: 0.9,
  percentage: 75.5,
};

// Unused parameter that should get an underscore
function testFunction(reallyUnusedParam: string): void {
  console.log('Test');
}
