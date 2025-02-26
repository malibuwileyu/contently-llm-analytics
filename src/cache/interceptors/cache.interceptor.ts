import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache.service';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  keyGenerator?: (context: ExecutionContext) => string;
}

export const CACHE_KEY_METADATA = 'cache_key_metadata';
export const CACHE_TTL_METADATA = 'cache_ttl_metadata';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get cache options from metadata
    const cacheKey = this.getCacheKey(context);
    const ttl = this.getTtl(context);

    if (!cacheKey) {
      return next.handle();
    }

    try {
      // Try to get from cache
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedData);
      }

      // Cache miss, get fresh data
      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.cacheService.set(cacheKey, data, ttl);
          } catch (error) {
            this.logger.error(`Failed to cache response: ${error.message}`, error.stack);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache interceptor error: ${error.message}`, error.stack);
      return next.handle();
    }
  }

  private getCacheKey(context: ExecutionContext): string | null {
    // Check if a custom key generator is provided
    const customKey = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
    if (customKey) {
      return customKey;
    }

    // Generate key based on context type
    const contextType = context.getType();
    if (contextType === 'http') {
      return this.getHttpCacheKey(context);
    } 
    
    // Check if it's a GraphQL context by trying to create a GqlExecutionContext
    try {
      const gqlContext = GqlExecutionContext.create(context);
      if (gqlContext.getInfo()) {
        return this.getGraphQLCacheKey(context);
      }
    } catch (error) {
      // Not a GraphQL context
    }

    return null;
  }

  private getHttpCacheKey(context: ExecutionContext): string | null {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, query, params } = request;
    
    // Don't cache non-GET requests by default
    if (method !== 'GET') {
      return null;
    }

    // Create a key based on the URL, query params, and route params
    const queryString = Object.keys(query).length 
      ? `?${new URLSearchParams(query as Record<string, string>).toString()}`
      : '';
    
    const paramsString = Object.keys(params).length
      ? `:${Object.values(params).join(':')}`
      : '';

    return `http:${method}:${url}${queryString}${paramsString}`;
  }

  private getGraphQLCacheKey(context: ExecutionContext): string | null {
    const gqlContext = GqlExecutionContext.create(context);
    const info = gqlContext.getInfo();
    const variables = gqlContext.getArgs();
    
    if (!info) {
      return null;
    }

    // Create a key based on the operation name, field name, and variables
    const operationType = info.operation?.operation || 'query';
    const fieldName = info.fieldName;
    const variablesString = Object.keys(variables).length
      ? `:${JSON.stringify(variables)}`
      : '';

    return `graphql:${operationType}:${fieldName}${variablesString}`;
  }

  private getTtl(context: ExecutionContext): number | undefined {
    return this.reflector.get(CACHE_TTL_METADATA, context.getHandler());
  }
} 