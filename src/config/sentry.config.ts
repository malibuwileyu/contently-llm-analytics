import { registerAs } from '@nestjs/config';

export interface SentryConfig {
  dsn: string;
  environment: string;
  enableInDevelopment: boolean;
  tracesSampleRate: number;
  debug: boolean;
}

export default registerAs('sentry', (): SentryConfig => ({
  dsn: process.env.SENTRY_DSN || '',
  environment: process.env.NODE_ENV || 'development',
  enableInDevelopment: process.env.SENTRY_ENABLE_IN_DEVELOPMENT === 'true',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  debug: process.env.SENTRY_DEBUG === 'true',
})); 