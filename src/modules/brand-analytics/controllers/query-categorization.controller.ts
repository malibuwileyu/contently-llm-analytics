import {
  Controller,
  Post,
  Body,
  Logger,
  HttpException,
  HttpStatus,
  Query,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { QueryCategorizationService } from '../services/query-categorization.service';
import {
  QueryCategorizationDto,
  QueryCategorizationResponseDto,
  QueryTaggingDto,
  QueryTaggingResponseDto,
} from '../dto/query-categorization.dto';

@ApiTags('query-categorization')
@Controller('query-categorization')
export class QueryCategorizationController {
  private readonly logger = new Logger(QueryCategorizationController.name);

  constructor(
    private readonly queryCategorizationService: QueryCategorizationService,
  ) {}

  @Post('categorize')
  @ApiOperation({
    summary: 'Categorize a search query by intent and extract topics',
  })
  @ApiBody({ type: QueryCategorizationDto })
  @ApiResponse({
    status: 200,
    description: 'Query categorization results',
    type: QueryCategorizationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async categorizeQuery(
    @Body() categorizationDto: QueryCategorizationDto,
  ): Promise<QueryCategorizationResponseDto> {
    try {
      return await this.queryCategorizationService.categorizeQuery(
        categorizationDto.query,
      );
    } catch (error) {
      this.logger.error(
        `Error categorizing query: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to categorize query');
    }
  }

  @Post('tag')
  @ApiOperation({ summary: 'Tag a search query with relevant metadata' })
  @ApiBody({ type: QueryTaggingDto })
  @ApiQuery({
    name: 'categoryId',
    description: 'Optional business category ID for context',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Query tagging results',
    type: QueryTaggingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async tagQuery(
    @Body() taggingDto: QueryTaggingDto,
  ): Promise<QueryTaggingResponseDto> {
    try {
      return await this.queryCategorizationService.tagQuery(
        taggingDto.query,
        taggingDto.categoryId,
      );
    } catch (error) {
      this.logger.error(`Error tagging query: ${error.message}`, error.stack);

      if (error.message.includes('not found')) {
        throw new HttpException(error.message, HttpStatus.NOT_FOUND);
      }

      throw new InternalServerErrorException('Failed to tag query');
    }
  }
}
