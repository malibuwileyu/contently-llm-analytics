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
import {
  CACHE_KEY_METADATA,
  CACHE_TTL_METADATA,
  NO_CACHE_METADATA,
} from '../decorators/cache.decorators';

export interface CacheOptions {
  ttl?: number;
  keyPrefix?: string;
  keyGenerator?: (context: ExecutionContext) => string;
}

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
  ): Promise<Observable<unknown>> {
    const noCache = this.reflector.get(NO_CACHE_METADATA, context.getHandler());
    if (noCache) {
      return next.handle();
    }

    const key = this.getCacheKey(context);
    const ttl = this.reflector.get(CACHE_TTL_METADATA, context.getHandler());

    const cachedValue = await this.cacheService.get(key);
    if (cachedValue !== null) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return of(cachedValue);
    }

    this.logger.debug(`Cache miss for key: ${key}`);
    return next.handle().pipe(
      tap(async response => {
        try {
          await this.cacheService.set(key, response, ttl);
        } catch (error) {
          this.logger.error(
            `Failed to cache response: ${error.message}`,
            error.stack,
          );
        }
      }),
    );
  }

  private getCacheKey(context: ExecutionContext): string {
    const customKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );
    if (customKey) {
      return customKey;
    }

    const request = context.switchToHttp().getRequest();
    const { url, method, body, query } = request;
    return `${method}:${url}:${JSON.stringify(body)}:${JSON.stringify(query)}`;
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
