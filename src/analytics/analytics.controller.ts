import {
  Controller,
  Get,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { DashboardService } from './services/dashboard.service';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  async getOverview() {
    try {
      return await this.dashboardService.getDashboardOverview();
    } catch (error) {
      this.logger.error('Error fetching analytics overview:', error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch analytics overview',
          message: 'An error occurred while fetching the analytics overview.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('customers/:id/stats')
  async getCustomerStats(@Param('id') customerId: string) {
    try {
      return await this.dashboardService.getCustomerStats(customerId);
    } catch (error) {
      this.logger.error(`Error fetching customer stats for ${customerId}:`, error);
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to fetch customer stats',
          message: 'An error occurred while fetching the customer stats.',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 