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
import { BusinessCategoryService } from '../services/business-category.service';
import { BusinessCategoryEntity } from '../entities/business-category.entity';

@ApiTags('business-categories')
@Controller('business-categories')
export class BusinessCategoryController {
  private readonly logger = new Logger(BusinessCategoryController.name);

  constructor(
    private readonly businessCategoryService: BusinessCategoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all business categories' })
  @ApiResponse({
    status: 200,
    description: 'List of business categories',
    type: [BusinessCategoryEntity],
  })
  async getAllCategories(): Promise<BusinessCategoryEntity[]> {
    try {
      return await this.businessCategoryService.getAllCategories();
    } catch (error) {
      this.logger.error(
        `Error getting categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get categories');
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for business categories by keyword' })
  @ApiQuery({ name: 'keyword', description: 'Search keyword', required: true })
  @ApiResponse({
    status: 200,
    description: 'List of matching business categories',
    type: [BusinessCategoryEntity],
  })
  async searchCategories(
    @Query('keyword') keyword: string,
  ): Promise<BusinessCategoryEntity[]> {
    try {
      return await this.businessCategoryService.searchCategories(keyword);
    } catch (error) {
      this.logger.error(
        `Error searching categories: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to search categories');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a business category by ID' })
  @ApiParam({ name: 'id', description: 'Business category ID' })
  @ApiResponse({
    status: 200,
    description: 'The business category',
    type: BusinessCategoryEntity,
  })
  @ApiResponse({ status: 404, description: 'Business category not found' })
  async getCategoryById(
    @Param('id') id: string,
  ): Promise<BusinessCategoryEntity> {
    try {
      return await this.businessCategoryService.getCategoryById(id);
    } catch (error) {
      this.logger.error(
        `Error getting category: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to get category');
    }
  }

  @Get(':id/subcategories')
  @ApiOperation({ summary: 'Get subcategories for a business category' })
  @ApiParam({ name: 'id', description: 'Parent category ID' })
  @ApiResponse({
    status: 200,
    description: 'List of subcategories',
    type: [BusinessCategoryEntity],
  })
  @ApiResponse({ status: 404, description: 'Parent category not found' })
  async getSubcategories(
    @Param('id') parentId: string,
  ): Promise<BusinessCategoryEntity[]> {
    try {
      return await this.businessCategoryService.getSubcategories(parentId);
    } catch (error) {
      this.logger.error(
        `Error getting subcategories: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to get subcategories');
    }
  }

  @Get(':id/hierarchy')
  @ApiOperation({
    summary: 'Get a category hierarchy (parent with subcategories)',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  @ApiResponse({
    status: 200,
    description: 'The category hierarchy',
    schema: {
      properties: {
        category: {
          type: 'object',
          $ref: '#/components/schemas/BusinessCategoryEntity',
        },
        subcategories: {
          type: 'array',
          items: { $ref: '#/components/schemas/BusinessCategoryEntity' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryHierarchy(@Param('id') id: string): Promise<{
    category: BusinessCategoryEntity;
    subcategories: BusinessCategoryEntity[];
  }> {
    try {
      return await this.businessCategoryService.getCategoryHierarchy(id);
    } catch (error) {
      this.logger.error(
        `Error getting category hierarchy: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to get category hierarchy',
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new business category' })
  @ApiResponse({
    status: 201,
    description: 'The created business category',
    type: BusinessCategoryEntity,
  })
  async createCategory(
    @Body() data: Partial<BusinessCategoryEntity>,
  ): Promise<BusinessCategoryEntity> {
    try {
      return await this.businessCategoryService.createCategory(data);
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create category');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a business category' })
  @ApiParam({ name: 'id', description: 'Business category ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated business category',
    type: BusinessCategoryEntity,
  })
  @ApiResponse({ status: 404, description: 'Business category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body() data: Partial<BusinessCategoryEntity>,
  ): Promise<BusinessCategoryEntity> {
    try {
      return await this.businessCategoryService.updateCategory(id, data);
    } catch (error) {
      this.logger.error(
        `Error updating category: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update category');
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a business category' })
  @ApiParam({ name: 'id', description: 'Business category ID' })
  @ApiResponse({ status: 204, description: 'Category successfully deleted' })
  @ApiResponse({ status: 404, description: 'Business category not found' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    try {
      await this.businessCategoryService.deleteCategory(id);
    } catch (error) {
      this.logger.error(
        `Error deleting category: ${error.message}`,
        error.stack,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to delete category');
    }
  }
}
