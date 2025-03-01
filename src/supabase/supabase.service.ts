import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { AuthResult, AuthError, User, Session } from '../auth/types/auth.types';
import { CacheService } from '../cache/cache.service';
import { Logger } from '@nestjs/common';

interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  tokentype?: string;
}

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient<Database>;
  private readonly USER_CACHE_TTL = 300; // 5 minutes
  private readonly logger = new Logger(SupabaseService.name);

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('health_check');
      if (error) throw error;
      return true;
    } catch (error) {
      this.logger.error('Supabase health check _failed:', error);
      return false;
    }
  }

  getClient(): SupabaseClient<Database> {
    return this.supabase;
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const result = await this.supabase.auth.signUp({
      email,
      password,
    });
    return {
      data: {
        user: result.data?.user || null,
        session: result.data?.session
          ? this.mapSession(result.data.session)
          : null,
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
        user: result.data?.user || null,
        session: result.data?.session
          ? this.mapSession(result.data.session)
          : null,
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
        const { data, error } = await this.supabase.auth.getUser(token);

        if (error || !data?.user) {
          throw error || new Error('User not found');
        }

        return data.user as User;
      },
      this.USER_CACHE_TTL,
    );
  }

  /**
   * Maps Supabase Session to our custom Session type
   */
  private mapSession(supabaseSession: SupabaseSession): Session {
    return {
      access_token: supabaseSession.access_token,
      refresh_token: supabaseSession.refresh_token,
      expires_in: supabaseSession.expires_in || 3600, // Default to 1 hour if not provided
      tokentype: supabaseSession.tokentype || 'bearer',
    };
  }
}
