import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return createClient(
          configService.get<string>('NEXT_PUBLIC_SUPABASE_URL'),
          configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: ['SUPABASE_CLIENT'],
})
export class SupabaseModule {}
