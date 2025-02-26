declare module '@supabase/supabase-js' {
  import { Database } from './supabase';

  export interface SupabaseClientOptions {
    auth?: {
      autoRefreshToken?: boolean;
      persistSession?: boolean;
      detectSessionInUrl?: boolean;
    };
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

  export interface SupabaseClient<T = any> {
    from<TableName extends keyof T['public']['Tables']>(
      table: TableName
    ): any;
    rpc<FunctionName extends keyof T['public']['Functions']>(
      fn: FunctionName,
      args?: T['public']['Functions'][FunctionName]['Args']
    ): Promise<PostgrestResponse<T['public']['Functions'][FunctionName]['Returns']>>;
    auth: any;
  }

  export function createClient<T = any>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions
  ): SupabaseClient<T>;
} 