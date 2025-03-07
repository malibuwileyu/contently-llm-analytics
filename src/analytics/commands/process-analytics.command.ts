import { Command, CommandRunner, Option } from 'nest-commander';
import { Logger } from '@nestjs/common';
import { AnalyticsProcessorService } from '../services/analytics-processor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitorEntity } from '../../modules/brand-analytics/entities/competitor.entity';

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
    private readonly analyticsProcessor: AnalyticsProcessorService,
    @InjectRepository(CompetitorEntity)
    private readonly competitorRepository: Repository<CompetitorEntity>,
  ) {
    super();
  }

  async run(
    passedParams: string[],
    options?: ProcessAnalyticsOptions,
  ): Promise<void> {
    try {
      this.logger.log('Starting analytics processing...');

      if (options?.customerId) {
        this.logger.log(
          `Processing analytics for customer: ${options.customerId}`,
        );
      } else {
        this.logger.log('Processing analytics for all customers');
      }

      const customer = await this.competitorRepository.findOne({
        where: { id: options?.customerId },
      });

      if (!customer) {
        throw new Error(`Customer not found: ${options?.customerId}`);
      }

      const analysis = {
        question: '',
        aiResponse: {
          content: '',
          metadata: {},
        },
        brandHealth: {
          visibilityMetrics: {
            overallVisibility: 0,
            categoryRankings: {},
            competitorComparison: {},
          },
          llmPresence: {
            knowledgeBaseStrength: 0,
            contextualAuthority: 0,
            topicalLeadership: [],
          },
          trendsOverTime: {
            visibilityTrend: 'stable',
            rankingStability: 1,
            competitorDynamics: 'neutral',
          },
        },
        brandMentions: [],
        metrics: {
          visibilityStats: {
            prominenceScore: 0,
          },
        },
      };

      await this.analyticsProcessor.processAnalysis(
        customer,
        analysis,
        'industry',
      );

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
