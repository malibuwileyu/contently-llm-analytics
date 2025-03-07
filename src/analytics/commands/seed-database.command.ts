import { Command, CommandRunner, Option } from 'nest-commander';
import { Injectable } from '@nestjs/common';
import { DatabaseSeedingService } from '../services/database-seeding.service';

interface SeedCommandOptions {
  companyId?: string;
}

@Injectable()
@Command({
  name: 'seed-database',
  description: 'Seed the database with brand visibility analyses',
})
export class SeedDatabaseCommand extends CommandRunner {
  constructor(private readonly seedingService: DatabaseSeedingService) {
    super();
  }

  async run(
    passedParams: string[],
    options?: SeedCommandOptions,
  ): Promise<void> {
    try {
      await this.seedingService.seedCustomerDatabase(options?.companyId);
    } catch (error) {
      console.error('Error seeding database:', error);
      process.exit(1);
    }
  }

  @Option({
    flags: '-c, --company-id [companyId]',
    description: 'Specific company ID to seed (optional)',
  })
  parseCompanyId(val: string): string {
    return val;
  }
} 