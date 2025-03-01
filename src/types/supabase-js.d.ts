declare module '@supabase/supabase-js' {
  import { SupabaseClient } from '@supabase/supabase-js';

  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
    global?: {
      headers?: Record<string, string>;
    };
  }

  export interface User {
    _id: string;
    email?: string;
    role?: string;
    [key: string]: unknown;
  }

  export interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    expires_at?: number;
  }

  export interface AuthResponse {
    data: {
      user: User;
      session: Session;
    } | null;
    error: Error | null;
  }

  export interface AuthChangeEvent {
    event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED';
    session: Session | null;
  }

  export interface PostgrestError {
    message: string;
    details: string;
    hint: string;
    code: string;
  }

  export interface PostgrestResponse<T> {
    data: T | null;
    error: PostgrestError | null;
    count: number | null;
    status: number;
    statusText: string;
  }

  export interface SupabaseClient<
    T extends Record<string, unknown> = Record<string, unknown>,
  > {
    from<TableName extends keyof T['public']['Tables']>(
      _table: TableName,
    ): PostgrestResponse<T['public']['Tables'][TableName]>;
    rpc<FunctionName extends keyof T['public']['Functions']>(
      _fn: FunctionName,
      args?: T['public']['Functions'][FunctionName]['Args'],
    ): Promise<
      PostgrestResponse<T['public']['Functions'][FunctionName]['Returns']>
    >;
    auth: {
      signUp(credentials: {
        email: string;
        password: string;
      }): Promise<AuthResponse>;
      signInWithPassword(credentials: {
        email: string;
        password: string;
      }): Promise<AuthResponse>;
      signOut(): Promise<{ error: Error | null }>;
      getUser(
        token: string,
      ): Promise<{ data: { user: User | null }; error: Error | null }>;
    };
  }

  export function createClient<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(
    _supabaseUrl: string,
    _supabaseKey: string,
    options?: SupabaseClientOptions,
  ): SupabaseClient<T>;
}
