import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  password: string;
}

export default registerAs('database', () => ({
  password: process.env.SUPABASE_PASSWORD,
}));
