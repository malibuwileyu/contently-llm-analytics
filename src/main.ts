import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerService } from './logger/logger.service';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config/app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Logger
  const logger = app.get(LoggerService);
  app.useLogger(logger);

  // Config
  const configService = app.get(ConfigService);
  const appConfig = configService.get<AppConfig>('app');

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

  // CORS
  app.enableCors({
    origin: appConfig?.allowedOrigins || [],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // API Prefix with exclusions for health endpoints
  const apiPrefix = appConfig?.apiPrefix || 'api';
  app.setGlobalPrefix(apiPrefix, {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/database', method: RequestMethod.GET },
      { path: 'health/readiness', method: RequestMethod.GET },
      { path: 'health/liveness', method: RequestMethod.GET },
      { path: 'health/cache', method: RequestMethod.GET },
      { path: 'health/services', method: RequestMethod.GET },
      { path: 'health/memory', method: RequestMethod.GET },
      { path: 'health/disk', method: RequestMethod.GET },
      { path: 'health/metrics', method: RequestMethod.GET },
      { path: 'health/auth', method: RequestMethod.GET },
      { path: 'health/status', method: RequestMethod.GET },
      { path: 'metrics', method: RequestMethod.GET },
    ],
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Contently LLM Analytics API')
    .setDescription('API documentation for Contently LLM Analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Start Server
  const port = appConfig?.port || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on: ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap();
