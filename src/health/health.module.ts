import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [TerminusModule, HttpModule, SupabaseModule],
  controllers: [HealthController],
})
export class HealthModule {}
