import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    credentials: true,
  });

  // API Prefix with health check exclusions
  const apiPrefix = 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/(.*)', method: RequestMethod.GET }, // This will match all health/* endpoints
    ],
  });

  await app.listen(10001);
}
bootstrap();
