import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseService } from './supabase.service';
import { CacheModule } from '../auth/cache/cache.module';

@Module({
  imports: [ConfigModule, forwardRef(() => CacheModule)],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
