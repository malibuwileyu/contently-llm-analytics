import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret: string;
  };
  session: {
    maxAge: number;
    refreshInterval: number;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
}

export default registerAs('auth', (): AuthConfig => ({
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || ''
  },
  session: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400', 10), // 24 hours
    refreshInterval: parseInt(process.env.SESSION_REFRESH_INTERVAL || '3600', 10) // 1 hour
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback'
  }
})); 