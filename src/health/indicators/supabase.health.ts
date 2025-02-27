import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseHealthIndicator extends HealthIndicator {
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      throw new Error('Missing required Supabase configuration');
    }

    this.supabaseUrl = url;
    this.supabaseAnonKey = key;
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      
      // Try to fetch system health
      const { data, error } = await supabase.rpc('health_check');
      
      if (error) {
        throw error;
      }

      return this.getStatus(key, true, {
        status: 'ok',
        responseTime: data?.response_time || 0,
      });
    } catch (error) {
      return this.getStatus(key, false, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
} 