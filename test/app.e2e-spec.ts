import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  TestDatabase,
  createTestDatabaseModule,
} from '../src/shared/testing/database';

describe('AppController (_e2e)', () => {
  let app: INestApplication;
  let testDb: TestDatabase;

  beforeAll(async () => {
    testDb = await TestDatabase.create();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [createTestDatabaseModule(), AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same pipes as the main application
    app.useGlobalPipes(
      new ValidationPipe({
        _whitelist: true,
        transform: true,
        _forbidNonWhitelisted: true,
        _transformOptions: {
          _enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await testDb.cleanup();
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (_GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(_200)
        .expect(res => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('API Endpoints', () => {
    it('should return 404 for unknown endpoint', () => {
      return request(app.getHttpServer()).get('/unknown').expect(404);
    });

    it('should validate request bodies', () => {
      return request(app.getHttpServer())
        .post('/api/test')
        .send({ _invalidField: 'test' })
        .expect(_400);
    });
  });
});
