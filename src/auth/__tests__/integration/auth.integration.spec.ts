import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { Response } from 'supertest';
import { AuthModule } from '../../auth.module';
import { ConfigModule } from '@nestjs/config';
import { Role } from '../../enums/role.enum';
import { Permission } from '../../enums/permission.enum';
import { JwtService } from '../../services/jwt.service';
import { TestController } from '../test.controller';
import { TestResolver } from '../test.resolver';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GoogleStrategy } from '../../strategies/google.strategy';

// Add a type for the request object
type SuperTestRequest = request.SuperTest<request.Test>;

describe('Auth Integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let httpServer: any;
  let testRequest: SuperTestRequest;

  const testUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    roles: [Role.USER],
    permissions: [Permission.READ_CONTENT]
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AuthModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [() => ({
            auth: {
              supabase: {
                jwtSecret: 'test-secret'
              },
              session: {
                maxAge: 3600
              },
              google: {
                clientId: 'test-client-id',
                clientSecret: 'test-client-secret',
                callbackUrl: 'http://localhost:3000/api/auth/google/callback'
              }
            }
          })]
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false
        })
      ],
      controllers: [TestController],
      providers: [TestResolver]
    })
      .overrideProvider(GoogleStrategy)
      .useValue({
        validate: jest.fn().mockResolvedValue(testUser)
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    httpServer = app.getHttpServer();
    testRequest = request(httpServer);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Protected Routes', () => {
    let validToken: string;

    beforeEach(async () => {
      validToken = await jwtService.generateToken(testUser);
    });

    describe('Role-based access', () => {
      it('should allow access with admin role', async () => {
        const userWithRole = { ...testUser, roles: [Role.ADMIN] };
        const adminToken = await jwtService.generateToken(userWithRole);

        // @ts-ignore
        await testRequest
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body.message).toBe('Admin dashboard accessed successfully');
          });
      });

      it('should deny access with incorrect role', async () => {
        // @ts-ignore
        await testRequest
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(403);
      });
    });

    describe('Permission-based access', () => {
      it('should allow access with required permission', async () => {
        const userWithPermission = { ...testUser, permissions: [Permission.MANAGE_SYSTEM] };
        const permissionToken = await jwtService.generateToken(userWithPermission);

        // @ts-ignore
        await testRequest
          .post('/system/settings')
          .set('Authorization', `Bearer ${permissionToken}`)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body.message).toBe('System settings updated successfully');
          });
      });

      it('should deny access with incorrect permission', async () => {
        // @ts-ignore
        await testRequest
          .post('/system/settings')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(403);
      });
    });

    describe('Token validation', () => {
      it('should reject invalid token format', async () => {
        // @ts-ignore
        await testRequest
          .get('/protected')
          .set('Authorization', 'Invalid-Token-Format')
          .expect(401);
      });

      it('should reject expired token', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

        // @ts-ignore
        await testRequest
          .get('/protected')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);
      });

      it('should accept valid token', async () => {
        // @ts-ignore
        await testRequest
          .get('/protected')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body.message).toBe('Protected route accessed successfully');
          });
      });
    });

    describe('GraphQL Authentication', () => {
      const PROTECTED_QUERY = `
        query {
          protectedData {
            id
            name
          }
        }
      `;

      it('should allow authenticated GraphQL queries', async () => {
        // @ts-ignore
        const response = await testRequest
          .post('/graphql')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ query: PROTECTED_QUERY })
          .expect(200);

        expect(response.body.data.protectedData).toBe('This is protected data');
      });

      it('should reject unauthenticated GraphQL queries', async () => {
        // @ts-ignore
        const response = await testRequest
          .post('/graphql')
          .send({ query: PROTECTED_QUERY })
          .expect(200);

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('Unauthorized');
      });
    });
  });
}); 