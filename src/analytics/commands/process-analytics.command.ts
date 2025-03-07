import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { AnalyticsProcessorService } from '../services/analytics-processor.service';

interface ProcessAnalyticsOptions {
  customerId?: string;
}

@Command({
  name: 'process-analytics',
  description: 'Process analytics for customers',
})
export class ProcessAnalyticsCommand extends CommandRunner {
  private readonly logger = new Logger(ProcessAnalyticsCommand.name);

  constructor(
    private readonly analyticsProcessor: AnalyticsProcessorService
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options?: ProcessAnalyticsOptions
  ): Promise<void> {
    try {
      this.logger.log('Starting analytics processing...');

      if (options?.customerId) {
        this.logger.log(`Processing analytics for customer: ${options.customerId}`);
      } else {
        this.logger.log('Processing analytics for all customers');
      }

      await this.analyticsProcessor.processAnalytics(options?.customerId);

      this.logger.log('Analytics processing completed successfully');
    } catch (error) {
      this.logger.error('Error processing analytics:', error);
      throw error;
    }
  }

  @Option({
    flags: '-c, --customerId [customerId]',
    description: 'Customer ID to process analytics for',
  })
  parseCustomerId(val: string): string {
    return val;
  }
} 