import { Module } from '@nestjs/common';
import { AnalyticsGateway } from './gateways/analytics.gateway';
import { SupabaseModule } from '../../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [AnalyticsGateway],
  exports: [AnalyticsGateway],
})
export class RealTimeModule {} 