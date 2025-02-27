import { Module } from '@nestjs/common';
import { SearchService } from './services/search.service';

/**
 * Module for search functionality
 */
@Module({
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {} 