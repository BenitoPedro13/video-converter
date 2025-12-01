import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  TestAuthService,
  createTestUser,
  delay,
  TestUser,
  getAvailablePort,
} from './helpers/test-utils';

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ErrorResponse {
  statusCode?: number;
  message: string;
}

interface ValidateResponse {
  id: string;
  email: string;
}

describe('Gateway Authentication (e2e)', () => {
  let app: INestApplication;
  let authService: TestAuthService;
  let testUser: TestUser;
  let authToken: string;

  beforeAll(async () => {
    // Start auth service
    authService = new TestAuthService();
    const authServicePort = await getAvailablePort();
    await authService.start(authServicePort);

    // Set AUTH_SERVICE_URL for the gateway
    process.env.AUTH_SERVICE_URL = `http://localhost:${authServicePort}`;

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
    if (app) {
      await app.close();
    }
    if (authService) {
      await authService.stop();
    }
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
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.name).toBe(testUser.name);
      expect(body.user).toHaveProperty('id');
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
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('access_token');
      expect(body).toHaveProperty('user');
      expect(body.user.email).toBe(testUser.email);
    });

    it('POST /auth/login - should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('Invalid credentials');
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

      const body = response.body as AuthResponse;
      authToken = body.access_token;
    });

    it('GET / - should allow request to public route without token', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('GET / - should allow request with valid token', async () => {
      await request(app.getHttpServer())
        .get('/')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect('Hello World!');
    });

    it('GET /auth/validate - should reject request with invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(401);

      const body = response.body as ErrorResponse;
      expect(body).toHaveProperty('message');
      expect(body.message).toContain('Invalid or expired token');
    });

    it('GET /auth/validate - should reject request with malformed authorization header', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
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

      const body = response.body as AuthResponse;
      authToken = body.access_token;
    });

    it('should validate token and attach user data to request', async () => {
      // The auth guard should validate the token and allow access
      // We can verify this by successfully accessing a protected route
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body as ValidateResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
    });

    it('should handle expired tokens gracefully', async () => {
      // Use a clearly invalid/expired token
      const expiredToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.invalid';

      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('Invalid or expired token');
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
        .expect(200);

      // Register second user
      const response2 = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: user2.email,
          password: user2.password,
          name: user2.name,
        })
        .expect(200);

      const body1 = response1.body as AuthResponse;
      const body2 = response2.body as AuthResponse;
      expect(body1.user.email).toBe(user1.email);
      expect(body2.user.email).toBe(user2.email);
      expect(body1.access_token).not.toBe(body2.access_token);
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
        .expect(200);

      // Try to register again with same email
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          password: 'different_password',
          name: 'Different Name',
        })
        .expect(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toContain('User already exists');
    });
  });
});
