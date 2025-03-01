import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CustomerResearchService } from '../services/customer-research.service';
import { CompetitorEntity } from '../entities/competitor.entity';

@ApiTags('customer-research')
@Controller('customer-research')
export class CustomerResearchController {
  private readonly logger = new Logger(CustomerResearchController.name);

  constructor(
    private readonly customerResearchService: CustomerResearchService,
  ) {}

  @Get('competitors')
  @ApiOperation({ summary: 'Get all competitors' })
  @ApiResponse({
    status: 200,
    description: 'List of competitors',
    type: [CompetitorEntity],
  })
  async getAllCompetitors(): Promise<CompetitorEntity[]> {
    try {
      return await this.customerResearchService.getAllCompetitors();
    } catch (error) {
      this.logger.error(
        `Error getting competitors: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get competitors');
    }
  }

  @Get('competitors/search')
  @ApiOperation({ summary: 'Search for competitors by keyword' })
  @ApiQuery({ name: 'keyword', description: 'Search keyword', required: true })
  @ApiResponse({
    status: 200,
    description: 'List of matching competitors',
    type: [CompetitorEntity],
  })
  async searchCompetitors(
    @Query('keyword') keyword: string,
  ): Promise<CompetitorEntity[]> {
    try {
      return await this.customerResearchService.searchCompetitors(keyword);
    } catch (error) {
      this.logger.error(
        `Error searching competitors: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to search competitors');
    }
  }

  @Get('competitors/:id')
  @ApiOperation({ summary: 'Get a competitor by ID' })
  @ApiParam({ name: 'id', description: 'Competitor ID' })
  @ApiResponse({
    status: 200,
    description: 'The competitor',
    type: CompetitorEntity,
  })
  @ApiResponse({ status: 404, description: 'Competitor not found' })
  async getCompetitorById(@Param('id') id: string): Promise<CompetitorEntity> {
    try {
      return await this.customerResearchService.getCompetitorById(id);
    } catch (error) {
      this.logger.error(
        `Error getting competitor: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to get competitor');
    }
  }

  @Get('category/:categoryId/competitors')
  @ApiOperation({ summary: 'Get competitors for a business category' })
  @ApiParam({ name: 'categoryId', description: 'Business category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of competitors in the category',
    type: [CompetitorEntity],
  })
  @ApiResponse({ status: 404, description: 'Business category not found' })
  async getCompetitorsByCategory(
    @Param('categoryId') categoryId: string,
  ): Promise<CompetitorEntity[]> {
    try {
      return await this.customerResearchService.getCompetitorsByCategory(
        categoryId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting competitors by category: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to get competitors by category',
      );
    }
  }

  @Get('category/:categoryId/customer')
  @ApiOperation({
    summary: 'Get the customer competitor for a business category',
  })
  @ApiParam({ name: 'categoryId', description: 'Business category ID' })
  @ApiResponse({
    status: 200,
    description: 'The customer competitor',
    type: CompetitorEntity,
  })
  @ApiResponse({
    status: 404,
    description: 'Business category or customer competitor not found',
  })
  async getCustomerCompetitor(
    @Param('categoryId') categoryId: string,
  ): Promise<CompetitorEntity> {
    try {
      return await this.customerResearchService.getCustomerCompetitor(
        categoryId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting customer competitor: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to get customer competitor',
      );
    }
  }

  @Post('competitors')
  @ApiOperation({ summary: 'Create a new competitor' })
  @ApiResponse({
    status: 201,
    description: 'The created competitor',
    type: CompetitorEntity,
  })
  async createCompetitor(
    @Body() data: Partial<CompetitorEntity>,
  ): Promise<CompetitorEntity> {
    try {
      return await this.customerResearchService.createCompetitor(data);
    } catch (error) {
      this.logger.error(
        `Error creating competitor: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create competitor');
    }
  }

  @Put('competitors/:id')
  @ApiOperation({ summary: 'Update a competitor' })
  @ApiParam({ name: 'id', description: 'Competitor ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated competitor',
    type: CompetitorEntity,
  })
  @ApiResponse({ status: 404, description: 'Competitor not found' })
  async updateCompetitor(
    @Param('id') id: string,
    @Body() data: Partial<CompetitorEntity>,
  ): Promise<CompetitorEntity> {
    try {
      return await this.customerResearchService.updateCompetitor(id, data);
    } catch (error) {
      this.logger.error(
        `Error updating competitor: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update competitor');
    }
  }

  @Delete('competitors/:id')
  @ApiOperation({ summary: 'Delete a competitor' })
  @ApiParam({ name: 'id', description: 'Competitor ID' })
  @ApiResponse({ status: 204, description: 'Competitor successfully deleted' })
  @ApiResponse({ status: 404, description: 'Competitor not found' })
  async deleteCompetitor(@Param('id') id: string): Promise<void> {
    try {
      await this.customerResearchService.deleteCompetitor(id);
    } catch (error) {
      this.logger.error(
        `Error deleting competitor: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete competitor');
    }
  }

  @Get('competitors-with-category')
  @ApiOperation({ summary: 'Get competitors with their business category' })
  @ApiQuery({
    name: 'categoryId',
    description: 'Optional business category ID to filter by',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of competitors with their business category',
    type: [CompetitorEntity],
  })
  async getCompetitorsWithCategory(
    @Query('categoryId') categoryId?: string,
  ): Promise<CompetitorEntity[]> {
    try {
      return await this.customerResearchService.getCompetitorsWithCategory(
        categoryId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting competitors with category: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to get competitors with category',
      );
    }
  }
}
