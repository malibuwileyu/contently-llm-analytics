import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
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

describe('Auth Integration', () => {
  let app: INestApplication;
  let jwtService: JwtService;

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
      it('should allow access with correct role', async () => {
        const userWithRole = {
          ...testUser,
          roles: [Role.ADMIN]
        };
        const adminToken = await jwtService.generateToken(userWithRole);

        await request(app.getHttpServer())
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200)
          .expect(res => {
            expect(res.body.message).toBe('Admin dashboard accessed successfully');
          });
      });

      it('should deny access with incorrect role', async () => {
        await request(app.getHttpServer())
          .get('/admin/dashboard')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(403);
      });
    });

    describe('Permission-based access', () => {
      it('should allow access with correct permission', async () => {
        const userWithPermission = {
          ...testUser,
          permissions: [Permission.MANAGE_SYSTEM]
        };
        const permissionToken = await jwtService.generateToken(userWithPermission);

        await request(app.getHttpServer())
          .post('/system/settings')
          .set('Authorization', `Bearer ${permissionToken}`)
          .expect(200)
          .expect(res => {
            expect(res.body.message).toBe('System settings updated successfully');
          });
      });

      it('should deny access with incorrect permission', async () => {
        await request(app.getHttpServer())
          .post('/system/settings')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(403);
      });
    });

    describe('Token validation', () => {
      it('should reject invalid token format', async () => {
        await request(app.getHttpServer())
          .get('/protected')
          .set('Authorization', 'Invalid-Token-Format')
          .expect(401);
      });

      it('should reject expired token', async () => {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
          'eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTUxNjIzOTAyM30.' +
          'signature';

        await request(app.getHttpServer())
          .get('/protected')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect(401);
      });

      it('should accept valid token', async () => {
        await request(app.getHttpServer())
          .get('/protected')
          .set('Authorization', `Bearer ${validToken}`)
          .expect(200)
          .expect(res => {
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
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ query: PROTECTED_QUERY })
          .expect(200);

        expect(response.body.errors).toBeUndefined();
        expect(response.body.data.protectedData).toEqual({
          id: 'test-id',
          name: 'Protected Data'
        });
      });

      it('should reject unauthenticated GraphQL queries', async () => {
        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({ query: PROTECTED_QUERY })
          .expect(200); // GraphQL always returns 200

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors[0].message).toBe('Unauthorized');
      });
    });
  });
}); 