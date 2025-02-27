import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards, Logger } from '@nestjs/common';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import { VolumeEstimationService } from '../services/volume-estimation.service';
import {
  VolumeEstimationOptionsInput,
  VolumeEstimationResultsType
} from '../graphql/volume-estimation.types';

/**
 * GraphQL resolver for volume estimation
 */
@Resolver(() => VolumeEstimationResultsType)
@UseGuards(GqlAuthGuard)
export class VolumeEstimationResolver {
  private readonly logger = new Logger(VolumeEstimationResolver.name);

  constructor(
    private readonly volumeEstimationService: VolumeEstimationService
  ) {}

  /**
   * Get volume estimation for a specific brand
   */
  @Query(() => VolumeEstimationResultsType, { name: 'volumeEstimation', description: 'Get conversation volume for a brand' })
  async getVolumeEstimation(
    @Args('brandId') brandId: string,
    @Args('options', { nullable: true }) options?: VolumeEstimationOptionsInput
  ): Promise<VolumeEstimationResultsType> {
    this.logger.debug(`Getting volume estimation for brand: ${brandId}`);
    
    const result = await this.volumeEstimationService.estimateVolume(
      brandId,
      options ? {
        startDate: options.startDate ? new Date(options.startDate) : undefined,
        endDate: options.endDate ? new Date(options.endDate) : undefined,
        includeDaily: options.includeDaily,
        includeWeekly: options.includeWeekly,
        includeMonthly: options.includeMonthly
      } : undefined
    );
    
    // Convert Date objects to ISO strings for the response
    return {
      metrics: result.metrics,
      byDay: result.byDay,
      byWeek: result.byWeek,
      byMonth: result.byMonth,
      period: {
        startDate: result.period.startDate.toISOString(),
        endDate: result.period.endDate.toISOString()
      }
    };
  }
} 