import { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const testUser = {
    email: 'e2e-test@example.com',
    password: 'password123',
    name: 'E2E Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Cleanup before tests
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    // Cleanup after tests
    await prismaService.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  const getServer = () => app.getHttpServer() as Server;

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(getServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('access_token');
          expect(body.user).toHaveProperty('id');
          expect(body.user.email).toBe(testUser.email);
          expect(body.user.name).toBe(testUser.name);
        });
    });

    it('should fail to register duplicate user', () => {
      return request(getServer())
        .post('/auth/register')
        .send(testUser)
        .expect(401);
    });

    it('should fail to register with invalid email', () => {
      return request(getServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail to register with short password', () => {
      return request(getServer())
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', () => {
      return request(getServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('access_token');
          expect(body.user.email).toBe(testUser.email);
        });
    });

    it('should fail login with invalid password', () => {
      return request(getServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail login with non-existent user', () => {
      return request(getServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });

    it('should fail login with invalid email format', () => {
      return request(getServer())
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });
  });

  describe('/auth/validate (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const loginResponse = await request(getServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });
      const body = loginResponse.body as AuthResponse;
      accessToken = body.access_token;
    });

    it('should validate valid token', () => {
      return request(getServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as AuthResponse['user'];
          expect(body.email).toBe(testUser.email);
        });
    });

    it('should fail with invalid token', () => {
      return request(getServer())
        .get('/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should fail without token', () => {
      return request(getServer()).get('/auth/validate').expect(401);
    });
  });
});
