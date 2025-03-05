import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwtSecret: string;
  sessionMaxAge: number;
  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;
}

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  sessionMaxAge: parseInt(process.env.SESSION_MAX_AGE || '3600', 10),
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
}));
