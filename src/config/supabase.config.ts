import { registerAs } from '@nestjs/config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
  password: string;
}

export default registerAs('supabase', (): SupabaseConfig => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;
  const password = process.env.SUPABASE_PASSWORD;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
  if (!jwtSecret) throw new Error('SUPABASE_JWT_SECRET is not defined');
  if (!password) throw new Error('SUPABASE_PASSWORD is not defined');

  return {
    url,
    anonKey,
    serviceRoleKey,
    jwtSecret,
    password,
  };
}); 