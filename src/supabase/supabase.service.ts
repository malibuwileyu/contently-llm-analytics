import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { User, AuthResponse } from '../auth/types/auth.types';

interface UserMetadata {
  firstName?: string;
  lastName?: string;
}

@Injectable()
export class SupabaseService {
  private readonly supabase: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async signUp(email: string, password: string, metadata?: UserMetadata): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${this.configService.get<string>('CLIENT_URL')}/auth/callback`,
          data: metadata ? {
            first_name: metadata.firstName,
            last_name: metadata.lastName,
            full_name: metadata.firstName && metadata.lastName ? 
              `${metadata.firstName} ${metadata.lastName}` : undefined,
          } : undefined
        },
      });

      if (error) {
        this.logger.error('Sign up error:', error);
        return { data: null, error: { message: error.message } };
      }

      return { 
        data: {
          user: data.user ? this.mapUser(data.user) : null,
          session: data.session
        }, 
        error: null 
      };
    } catch (error) {
      this.logger.error('Unexpected sign up error:', error);
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred' } 
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        this.logger.error('Sign in error:', error);
        return { data: null, error: { message: error.message } };
      }

      return { 
        data: {
          user: data.user ? this.mapUser(data.user) : null,
          session: data.session
        }, 
        error: null 
      };
    } catch (error) {
      this.logger.error('Unexpected sign in error:', error);
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred' } 
      };
    }
  }

  async signInWithGoogle(googleUser: { accessToken: string; refreshToken: string }): Promise<AuthResponse> {
    try {
      // First exchange the Google tokens for a Supabase session
      const { data: authData, error: authError } = await this.supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleUser.accessToken,
        nonce: undefined,
      });

      if (authError) {
        this.logger.error('Google sign in error:', authError);
        return { data: null, error: { message: authError.message } };
      }

      return { 
        data: {
          user: authData.user ? this.mapUser(authData.user) : null,
          session: authData.session
        }, 
        error: null 
      };
    } catch (error) {
      this.logger.error('Unexpected Google sign in error:', error);
      return { 
        data: null, 
        error: { message: 'An unexpected error occurred' } 
      };
    }
  }

  async verifyToken(token: string): Promise<User> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw error || new Error('User not found');
      }

      return this.mapUser(user);
    } catch (error) {
      this.logger.error('Token verification error:', error);
      throw error;
    }
  }

  private mapUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      roles: supabaseUser.user_metadata?.roles || [],
      permissions: supabaseUser.user_metadata?.permissions || [],
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.last_sign_in_at || supabaseUser.created_at,
      first_name: supabaseUser.user_metadata?.first_name,
      last_name: supabaseUser.user_metadata?.last_name,
      full_name: supabaseUser.user_metadata?.full_name,
    };
  }
} 