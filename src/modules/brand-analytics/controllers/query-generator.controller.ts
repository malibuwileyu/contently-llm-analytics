import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  HttpException,
  HttpStatus,
  Post,
  Body,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { QueryGeneratorService } from '../services';
import {
  BatchQueryGenerationDto,
  BatchQueryGenerationResponse,
} from '../dto/batch-query-generation.dto';
import {
  QueryValidationDto,
  QueryValidationResponseDto,
} from '../dto/query-validation.dto';

@ApiTags('query-generator')
@Controller('query-generator')
export class QueryGeneratorController {
  private readonly logger = new Logger(QueryGeneratorController.name);

  constructor(private readonly queryGeneratorService: QueryGeneratorService) {}

  @Get('category/:categoryId')
  @ApiOperation({
    summary: 'Generate queries for a specific business category',
  })
  @ApiParam({ name: 'categoryId', description: 'ID of the business category' })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of queries to generate',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of generated queries',
    type: [String],
  })
  @ApiResponse({ status: 404, description: 'Business category not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateQueriesForCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit?: number,
  ): Promise<string[]> {
    try {
      return await this.queryGeneratorService.generateQueriesForCategory(
        categoryId,
        limit ? parseInt(limit.toString(), 10) : undefined,
      );
    } catch (error) {
      this.logger.error(
        `Error generating queries: ${error.message}`,
        error.stack,
      );

      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Failed to generate queries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Generate queries for a specific customer' })
  @ApiParam({
    name: 'customerId',
    description: 'ID of the customer competitor',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of queries to generate',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of generated queries',
    type: [String],
  })
  @ApiResponse({ status: 404, description: 'Customer competitor not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateQueriesForCustomer(
    @Param('customerId') customerId: string,
    @Query('limit') limit?: number,
  ): Promise<string[]> {
    try {
      return await this.queryGeneratorService.generateQueriesForCustomer(
        customerId,
        limit ? parseInt(limit.toString(), 10) : undefined,
      );
    } catch (error) {
      this.logger.error(
        `Error generating queries for customer: ${error.message}`,
        error.stack,
      );

      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Failed to generate queries for customer',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('comparison/:competitor1Id/:competitor2Id')
  @ApiOperation({
    summary: 'Generate comparison queries between two competitors',
  })
  @ApiParam({
    name: 'competitor1Id',
    description: 'ID of the first competitor',
  })
  @ApiParam({
    name: 'competitor2Id',
    description: 'ID of the second competitor',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of queries to generate',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of generated comparison queries',
    type: [String],
  })
  @ApiResponse({ status: 404, description: 'Competitor not found' })
  @ApiResponse({
    status: 400,
    description: 'Competitors must be in the same business category',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async generateComparisonQueries(
    @Param('competitor1Id') competitor1Id: string,
    @Param('competitor2Id') competitor2Id: string,
    @Query('limit') limit?: number,
  ): Promise<string[]> {
    try {
      return await this.queryGeneratorService.generateComparisonQueries(
        competitor1Id,
        competitor2Id,
        limit ? parseInt(limit.toString(), 10) : undefined,
      );
    } catch (error) {
      this.logger.error(
        `Error generating comparison queries: ${error.message}`,
        error.stack,
      );

      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      if (error.message.includes('same business category')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'Failed to generate comparison queries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('batch')
  @ApiOperation({
    summary:
      'Generate queries in batch for multiple categories, _customers, and comparisons',
  })
  @ApiBody({ type: BatchQueryGenerationDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully generated queries in batch',
    type: BatchQueryGenerationResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async generateQueriesBatch(
    @Body() batchDto: BatchQueryGenerationDto,
  ): Promise<BatchQueryGenerationResponse> {
    try {
      return await this.queryGeneratorService.generateQueriesBatch(batchDto);
    } catch (error) {
      this.logger.error(
        `Error generating queries in batch: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate queries in batch',
      );
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a search query and provide feedback' })
  @ApiBody({ type: QueryValidationDto })
  @ApiResponse({
    status: 200,
    description: 'Query validation results',
    type: QueryValidationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async validateQuery(
    @Body() validationDto: QueryValidationDto,
  ): Promise<QueryValidationResponseDto> {
    try {
      return await this.queryGeneratorService.validateQuery(
        validationDto.query,
      );
    } catch (error) {
      this.logger.error(
        `Error validating query: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to validate query');
    }
  }
}
