import { Controller, Get, Post, Body, Query, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { VolumeEstimationService } from '../services/volume-estimation.service';
import { 
  VolumeEstimationOptionsDto, 
  VolumeEstimationResultsDto, 
  EstimateVolumeDto 
} from '../dto/volume-estimation.dto';
import { AuthGuard } from '@nestjs/passport';

/**
 * Controller for volume estimation
 */
@ApiTags('volume-estimation')
@Controller('api/volume-estimation')
@UseGuards(AuthGuard('jwt'))
export class VolumeEstimationController {
  private readonly logger = new Logger(VolumeEstimationController.name);

  constructor(
    private readonly volumeEstimationService: VolumeEstimationService
  ) {}

  /**
   * Estimate volume for a specific brand
   */
  @Post('estimate')
  @ApiOperation({ summary: 'Estimate conversation volume for a brand' })
  @ApiResponse({
    status: 200,
    description: 'Volume estimation results',
    type: VolumeEstimationResultsDto
  })
  async estimateVolume(
    @Body() estimateDto: EstimateVolumeDto
  ): Promise<VolumeEstimationResultsDto> {
    this.logger.debug(`Estimating volume for brand: ${estimateDto.brandId}`);
    
    const result = await this.volumeEstimationService.estimateVolume(
      estimateDto.brandId,
      estimateDto.options ? {
        startDate: estimateDto.options.startDate ? new Date(estimateDto.options.startDate) : undefined,
        endDate: estimateDto.options.endDate ? new Date(estimateDto.options.endDate) : undefined,
        includeDaily: estimateDto.options.includeDaily,
        includeWeekly: estimateDto.options.includeWeekly,
        includeMonthly: estimateDto.options.includeMonthly
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

  /**
   * Get volume estimation for a specific brand
   */
  @Get('brand/:brandId')
  @ApiOperation({ summary: 'Get conversation volume for a brand' })
  @ApiParam({
    name: 'brandId',
    description: 'The brand ID to analyze',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for the estimation',
    required: false,
    example: '2023-01-01T00:00:00Z'
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for the estimation',
    required: false,
    example: '2023-01-31T23:59:59Z'
  })
  @ApiQuery({
    name: 'includeDaily',
    description: 'Whether to include daily breakdown',
    required: false,
    example: true
  })
  @ApiQuery({
    name: 'includeWeekly',
    description: 'Whether to include weekly breakdown',
    required: false,
    example: true
  })
  @ApiQuery({
    name: 'includeMonthly',
    description: 'Whether to include monthly breakdown',
    required: false,
    example: true
  })
  @ApiResponse({
    status: 200,
    description: 'Volume estimation results',
    type: VolumeEstimationResultsDto
  })
  async getVolumeEstimation(
    @Param('brandId') brandId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includeDaily') includeDaily?: string,
    @Query('includeWeekly') includeWeekly?: string,
    @Query('includeMonthly') includeMonthly?: string
  ): Promise<VolumeEstimationResultsDto> {
    this.logger.debug(`Getting volume estimation for brand: ${brandId}`);
    
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includeDaily: includeDaily !== undefined ? includeDaily === 'true' : undefined,
      includeWeekly: includeWeekly !== undefined ? includeWeekly === 'true' : undefined,
      includeMonthly: includeMonthly !== undefined ? includeMonthly === 'true' : undefined
    };
    
    const result = await this.volumeEstimationService.estimateVolume(brandId, options);
    
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