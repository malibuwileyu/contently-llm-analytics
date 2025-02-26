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
import { CacheModule } from '../cache/cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '../metrics/metrics.module';
import { RouterModule } from '@nestjs/core';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
    SupabaseModule,
    CacheModule,
    TypeOrmModule,
    ConfigModule,
    MetricsModule.register({
      isGlobal: false,
      registerController: false,
    }),
    // Register the health module routes
    RouterModule.register([
      {
        path: 'health',
        module: HealthModule,
      },
    ]),
  ],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    ExternalServiceHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
    HealthSchedulerService,
  ],
  exports: [
    HealthSchedulerService,
  ],
})
export class HealthModule {}
