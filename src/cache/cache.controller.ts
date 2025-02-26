import {
  Controller,
  Get,
  Delete,
  Param,
  HttpStatus,
  HttpException,
  UseGuards,
  Post,
  Body,
} from '@nestjs/common';
import { CacheService } from './cache.service';
import { DistributedLockService } from './distributed-lock.service';
import { CacheWarmupService } from './cache-warmup.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('cache')
@Controller('cache')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class CacheController {
  constructor(
    private readonly cacheService: CacheService,
    private readonly lockService: DistributedLockService,
    private readonly warmupService: CacheWarmupService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Check cache health' })
  @ApiResponse({ status: 200, description: 'Cache is healthy' })
  @ApiResponse({ status: 503, description: 'Cache is unhealthy' })
  @Roles(Role.ADMIN)
  async checkHealth() {
    const isHealthy = await this.cacheService.isHealthy();
    if (!isHealthy) {
      throw new HttpException('Cache is unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return { status: 'ok', message: 'Cache is healthy' };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  @Roles(Role.ADMIN)
  async getStats() {
    const stats = await this.cacheService.getStats();
    return { status: 'ok', data: stats };
  }

  @Delete('flush')
  @ApiOperation({ summary: 'Flush the entire cache' })
  @ApiResponse({ status: 200, description: 'Cache flushed successfully' })
  @Roles(Role.ADMIN)
  async flushCache() {
    const success = await this.cacheService.flushAll();
    if (!success) {
      throw new HttpException('Failed to flush cache', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    return { status: 'ok', message: 'Cache flushed successfully' };
  }

  @Delete('keys/:pattern')
  @ApiOperation({ summary: 'Delete cache keys by pattern' })
  @ApiResponse({ status: 200, description: 'Keys deleted successfully' })
  @ApiParam({ name: 'pattern', description: 'Pattern to match keys (e.g., user:*)', type: 'string' })
  @Roles(Role.ADMIN)
  async deleteByPattern(@Param('pattern') pattern: string) {
    const count = await this.cacheService.delByPattern(pattern);
    return { 
      status: 'ok', 
      message: `Deleted ${count} keys matching pattern: ${pattern}` 
    };
  }

  @Delete('key/:key')
  @ApiOperation({ summary: 'Delete a specific cache key' })
  @ApiResponse({ status: 200, description: 'Key deleted successfully' })
  @ApiParam({ name: 'key', description: 'Cache key to delete', type: 'string' })
  @Roles(Role.ADMIN)
  async deleteKey(@Param('key') key: string) {
    await this.cacheService.del(key);
    return { status: 'ok', message: `Deleted key: ${key}` };
  }

  @Get('locks')
  @ApiOperation({ summary: 'Check if a key is locked' })
  @ApiResponse({ status: 200, description: 'Lock status' })
  @ApiParam({ name: 'key', description: 'Lock key to check', type: 'string' })
  @Roles(Role.ADMIN)
  async checkLock(@Param('key') key: string) {
    const isLocked = await this.lockService.isLocked(key);
    return { 
      status: 'ok', 
      locked: isLocked,
      key
    };
  }

  @Post('locks/:key')
  @ApiOperation({ summary: 'Acquire a lock' })
  @ApiResponse({ status: 200, description: 'Lock acquired successfully' })
  @ApiResponse({ status: 409, description: 'Failed to acquire lock' })
  @ApiParam({ name: 'key', description: 'Lock key to acquire', type: 'string' })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        ttl: { type: 'number', description: 'Time-to-live in milliseconds' },
        retryDelay: { type: 'number', description: 'Retry delay in milliseconds' },
        maxRetries: { type: 'number', description: 'Maximum number of retries' },
      }
    }
  })
  @Roles(Role.ADMIN)
  async acquireLock(
    @Param('key') key: string,
    @Body() options?: { ttl?: number; retryDelay?: number; maxRetries?: number }
  ) {
    const token = await this.lockService.acquireLock(key, options);
    if (!token) {
      throw new HttpException('Failed to acquire lock', HttpStatus.CONFLICT);
    }
    return { 
      status: 'ok', 
      message: `Acquired lock for key: ${key}`,
      token,
      key
    };
  }

  @Delete('locks/:key')
  @ApiOperation({ summary: 'Release a lock' })
  @ApiResponse({ status: 200, description: 'Lock released successfully' })
  @ApiResponse({ status: 400, description: 'Failed to release lock' })
  @ApiParam({ name: 'key', description: 'Lock key to release', type: 'string' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'Lock token received when acquiring the lock' },
      }
    }
  })
  @Roles(Role.ADMIN)
  async releaseLock(
    @Param('key') key: string,
    @Body('token') token: string
  ) {
    if (!token) {
      throw new HttpException('Token is required', HttpStatus.BAD_REQUEST);
    }
    
    const success = await this.lockService.releaseLock(key, token);
    if (!success) {
      throw new HttpException(
        'Failed to release lock (token may be invalid or lock expired)', 
        HttpStatus.BAD_REQUEST
      );
    }
    
    return { 
      status: 'ok', 
      message: `Released lock for key: ${key}`,
      key
    };
  }

  @Get('warmup/providers')
  @ApiOperation({ summary: 'Get registered warmup providers' })
  @ApiResponse({ status: 200, description: 'List of registered warmup providers' })
  @Roles(Role.ADMIN)
  async getWarmupProviders() {
    const providers = this.warmupService.getProviders();
    return { 
      status: 'ok', 
      count: providers.length,
      providers: providers.map(p => ({
        key: p.key,
        priority: p.priority || 0
      }))
    };
  }
} 