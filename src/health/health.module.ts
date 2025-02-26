import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ExternalServiceHealthIndicator } from './indicators/external-service.health';
import { MemoryHealthIndicator } from './indicators/memory.health';
import { DiskHealthIndicator } from './indicators/disk.health';
import { HealthSchedulerService } from './services/health-scheduler.service';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MetricsModule } from '../metrics/metrics.module';
import { SupabaseHealthIndicator } from './indicators/supabase.health';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    SupabaseModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('REDIS_HOST'),
        port: configService.get('REDIS_PORT'),
        ttl: 60,
      }),
      isGlobal: true,
    }),
    TypeOrmModule,
    ConfigModule,
    MetricsModule.register({
      isGlobal: false,
      registerController: false,
    }),
  ],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    ExternalServiceHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
    HealthSchedulerService,
    SupabaseHealthIndicator,
  ],
  exports: [
    HealthSchedulerService,
  ],
})
export class HealthModule {}
