import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  TestAuthService,
  createTestUser,
  delay,
  TestUser,
} from './helpers/test-utils';

describe('Gateway Authentication (e2e)', () => {
  let app: INestApplication;
  let authService: TestAuthService;
  let testUser: TestUser;
  let authToken: string;

  beforeAll(async () => {
    // Start auth service
    authService = new TestAuthService();
    await authService.start(3001);

    // Wait for auth service to be ready
    await delay(1000);

    // Create gateway app
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same configuration as main.ts
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    // Clean database
    await authService.cleanDatabase();
  });

  afterAll(async () => {
    await app.close();
    await authService.stop();
  });

  beforeEach(async () => {
    // Clean database before each test
    await authService.cleanDatabase();
    testUser = createTestUser();
  });

  describe('Public Routes (No Authentication Required)', () => {
    it('POST /auth/register - should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.user).toHaveProperty('id');
    });

    it('POST /auth/login - should login existing user', async () => {
      // First register
      await request(app.getHttpServer()).post('/auth/register').send({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
      });

      // Then login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('POST /auth/login - should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('Protected Routes (Authentication Required)', () => {
    beforeEach(async () => {
      // Register and get token for protected route tests
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        });

      authToken = response.body.access_token;
    });

    it('GET / - should reject request without token', async () => {
      const response = await request(app.getHttpServer()).get('/').expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('No authorization header');
    });

    it('GET / - should allow request with valid token', async () => {
      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Hello World!');
    });

    it('GET / - should reject request with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid or expired token');
    });

    it('GET / - should reject request with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Token Validation Flow', () => {
    beforeEach(async () => {
      // Register user
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        });

      authToken = response.body.access_token;
    });

    it('should validate token and attach user data to request', async () => {
      // The auth guard should validate the token and allow access
      // We can verify this by successfully accessing a protected route
      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.text).toBe('Hello World!');
    });

    it('should handle expired tokens gracefully', async () => {
      // Use a clearly invalid/expired token
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';

      const response = await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.message).toContain('Invalid or expired token');
    });
  });

  describe('Multiple Users', () => {
    it('should handle multiple user registrations', async () => {
      const user1 = createTestUser();
      const user2 = createTestUser();

      // Register first user
      const response1 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: user1.email,
          password: user1.password,
          name: user1.name,
        })
        .expect(201);

      // Register second user
      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: user2.email,
          password: user2.password,
          name: user2.name,
        })
        .expect(201);

      expect(response1.body.user.email).toBe(user1.email);
      expect(response2.body.user.email).toBe(user2.email);
      expect(response1.body.access_token).not.toBe(response2.body.access_token);
    });

    it('should reject duplicate email registration', async () => {
      // Register first time
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
        })
        .expect(201);

      // Try to register again with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: 'different_password',
          name: 'Different Name',
        })
        .expect(401);

      expect(response.body.message).toContain('User already exists');
    });
  });
});
