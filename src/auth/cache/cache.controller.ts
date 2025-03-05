import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';

@Controller('cache')
export class CacheController {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @Get(':key')
  async get(@Param('key') key: string) {
    return this.cacheManager.get(key);
  }

  @Post(':key')
  async set(@Param('key') key: string, @Body() value: any) {
    await this.cacheManager.set(key, value);
    return { message: 'Cache set successfully' };
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
    await this.cacheManager.del(key);
    return { message: 'Cache deleted successfully' };
  }
}
