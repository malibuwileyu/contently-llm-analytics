import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { DatabaseSeedingService } from './database-seeding.service';
import { AnalyticsJob } from '../entities/analytics-job.entity';

@Injectable()
export class AnalyticsJobProcessorService {
  private readonly logger = new Logger(AnalyticsJobProcessorService.name);
  private isProcessing = false;

  constructor(
    @InjectRepository(AnalyticsJob)
    private readonly jobRepository: Repository<AnalyticsJob>,
    private readonly databaseSeedingService: DatabaseSeedingService,
  ) {}

  @Cron('* * * * *') // Run every minute
  async processJobs() {
    if (this.isProcessing) {
      this.logger.debug('Job processor is already running');
      return;
    }

    try {
      this.isProcessing = true;
      this.logger.debug('Starting job processing');

      // Get pending jobs
      const pendingJobs = await this.jobRepository.find({
        where: { status: 'pending' },
        order: { created_at: 'ASC' },
        take: 5, // Process 5 jobs at a time
      });

      if (!pendingJobs.length) {
        this.logger.debug('No pending jobs found');
        return;
      }

      // Process each job
      await Promise.all(
        pendingJobs.map(async job => {
          try {
            // Update job status to processing
            await this.jobRepository.update(job.id, {
              status: 'processing',
              updated_at: new Date(),
            });

            // Process based on job type
            switch (job.job_type) {
              case 'seed_competitor':
                await this.databaseSeedingService.seedCustomerDatabase(job.metadata.competitor_id);
                break;
              default:
                throw new Error(`Unknown job type: ${job.job_type}`);
            }

            // Mark job as completed
            await this.jobRepository.update(job.id, {
              status: 'completed',
              updated_at: new Date(),
              completed_at: new Date(),
            });

            this.logger.log(
              `Successfully processed job ${job.id} of type ${job.job_type} for competitor ${job.metadata.competitor_id}`,
            );
          } catch (error) {
            // Mark job as failed
            await this.jobRepository.update(job.id, {
              status: 'failed',
              error_message: error.message,
              updated_at: new Date(),
            });

            this.logger.error(
              `Error processing job ${job.id} of type ${job.job_type}:`,
              error.stack,
            );
          }
        }),
      );
    } catch (error) {
      this.logger.error('Error in job processor:', error.stack);
    } finally {
      this.isProcessing = false;
      this.logger.debug('Finished job processing');
    }
  }

  async getJobStatus(jobId: string): Promise<AnalyticsJob | null> {
    return this.jobRepository.findOne({ where: { id: jobId } });
  }

  async getJobsByCompetitor(competitorId: string): Promise<AnalyticsJob[]> {
    return this.jobRepository
      .createQueryBuilder('job')
      .where("job.metadata->>'competitor_id' = :competitorId", { competitorId })
      .orderBy('job.created_at', 'DESC')
      .getMany();
  }

  async retryFailedJobs(): Promise<void> {
    const failedJobs = await this.jobRepository.find({
      where: { status: 'failed' },
      order: { created_at: 'ASC' },
    });

    for (const job of failedJobs) {
      await this.jobRepository.update(job.id, {
        status: 'pending',
        error_message: null,
        updated_at: new Date(),
      });
    }

    this.logger.log(`Reset ${failedJobs.length} failed jobs to pending status`);
  }

  async cleanupOldJobs(daysToKeep = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await this.jobRepository.delete({
      created_at: LessThan(cutoffDate),
      status: In(['completed', 'failed']),
    });

    this.logger.log(`Cleaned up jobs older than ${daysToKeep} days`);
  }
} 