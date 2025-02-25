import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { AuthResult, AuthError, User } from '../auth/types/auth.types';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private readonly USER_CACHE_TTL = 300; // 5 minutes

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!url || !key) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(url, key);
  }

  async checkHealth(): Promise<void> {
    try {
      // Try to fetch system health
      const { error } = await this.supabase.rpc('get_system_health');
      if (error) throw error;
    } catch (error) {
      throw new Error(`Supabase health check failed: ${error.message}`);
    }
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const result = await this.supabase.auth.signUp({
      email,
      password,
    });
    return {
      data: {
        user: result.data.user,
        session: result.data.session,
      },
      error: result.error as AuthError | null,
    };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const result = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    return {
      data: {
        user: result.data.user,
        session: result.data.session,
      },
      error: result.error as AuthError | null,
    };
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    const result = await this.supabase.auth.signOut();
    return {
      error: result.error as AuthError | null,
    };
  }

  async verifyToken(token: string): Promise<User> {
    const cacheKey = `user:${token}`;

    return this.cacheService.getOrSet<User>(
      cacheKey,
      async () => {
        const {
          data: { user },
          error,
        } = await this.supabase.auth.getUser(token);

        if (error || !user) {
          throw error || new Error('User not found');
        }

        return user;
      },
      this.USER_CACHE_TTL,
    );
  }
}
