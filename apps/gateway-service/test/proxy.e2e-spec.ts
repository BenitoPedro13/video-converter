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

describe('Gateway Proxy Routing (e2e)', () => {
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
    process.env.CONVERTER_SERVICE_URL = `http://localhost:${await getAvailablePort()}`; // Dummy port
    process.env.NOTIFICATION_SERVICE_URL = `http://localhost:${await getAvailablePort()}`; // Dummy port

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
  });

  beforeEach(async () => {
    // Clean database before each test
    await authService.cleanDatabase();
    testUser = createTestUser();

    // Register user and get token
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

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (authService) {
      await authService.stop();
    }
  });

  describe('Auth Service Proxy', () => {
    it('should proxy POST /auth/register to auth-service', async () => {
      const newUser = createTestUser();

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: newUser.email,
          password: newUser.password,
          name: newUser.name,
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('access_token');
      expect(body.user.email).toBe(newUser.email);
    });

    it('should proxy POST /auth/login to auth-service', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body).toHaveProperty('access_token');
      expect(body.user.email).toBe(testUser.email);
    });

    it('should proxy GET /auth/validate to auth-service (protected)', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const body = response.body as ValidateResponse;
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('email');
      expect(body.email).toBe(testUser.email);
    });

    it('should forward error responses from auth-service', async () => {
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

  describe('Request Forwarding', () => {
    it('should forward request body correctly', async () => {
      const userData = {
        email: createTestUser().email,
        password: 'TestPassword123!',
        name: 'Forwarding Test User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(200);

      const body = response.body as AuthResponse;
      expect(body.user.email).toBe(userData.email);
      expect(body.user.name).toBe(userData.name);
    });

    it('should forward authorization headers correctly', async () => {
      // The auth guard itself tests header forwarding
      // This test verifies the token is properly validated
      await request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should handle missing required fields in request body', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and name
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Error Handling', () => {
    it('should handle downstream service errors gracefully', async () => {
      // Try to login with invalid credentials
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
    });

    it('should return proper error for malformed requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          // Invalid email format
          email: 'not-an-email',
          password: 'test',
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Converter Service Proxy (Future)', () => {
    it('should reject /converter/* routes without authentication', async () => {
      await request(app.getHttpServer()).get('/converter/status').expect(401);
    });

    it('should allow /converter/* routes with valid token', async () => {
      // This will fail until converter service is implemented
      // but demonstrates the routing is set up correctly
      const response = await request(app.getHttpServer())
        .get('/converter/status')
        .set('Authorization', `Bearer ${authToken}`);

      // Will get connection error since converter service doesn't exist yet
      // but the gateway should attempt to forward the request
      expect([500, 502, 503, 504]).toContain(response.status);
    });
  });

  describe('Notification Service Proxy (Future)', () => {
    it('should reject /notification/* routes without authentication', async () => {
      await request(app.getHttpServer())
        .get('/notification/status')
        .expect(401);
    });

    it('should allow /notification/* routes with valid token', async () => {
      // This will fail until notification service is implemented
      const response = await request(app.getHttpServer())
        .get('/notification/status')
        .set('Authorization', `Bearer ${authToken}`);

      // Will get connection error since notification service doesn't exist yet
      expect([500, 502, 503, 504]).toContain(response.status);
    });
  });
});
