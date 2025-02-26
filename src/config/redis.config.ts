import { registerAs } from '@nestjs/config';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number;
  max: number;
  isGlobal: boolean;
  db?: number;
  enableWarmup?: boolean;
  evictionPolicy?: string;
}

export default registerAs('redis', (): RedisConfig => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  ttl: parseInt(process.env.REDIS_TTL || '300', 10), // 5 minutes default TTL
  max: parseInt(process.env.REDIS_MAX_ITEMS || '100', 10), // maximum number of items in cache
  isGlobal: true,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  enableWarmup: process.env.REDIS_ENABLE_WARMUP === 'true',
  evictionPolicy: process.env.REDIS_EVICTION_POLICY || 'volatile-lru', // Default to volatile-lru
})); 