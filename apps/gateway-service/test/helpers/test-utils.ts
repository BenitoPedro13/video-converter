import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule as AuthAppModule } from '../../../auth-service/src/app.module';
import { PrismaService } from '../../../auth-service/src/prisma/prisma.service';
import * as net from 'net';

export async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = (server.address() as net.AddressInfo).port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

export class TestAuthService {
  private app: INestApplication;
  private prisma: PrismaService;

  async start(port: number): Promise<void> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthAppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prisma = this.app.get(PrismaService);

    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await this.app.listen(port);
    console.log(`Test auth service started on port ${port}`);
  }

  async stop(): Promise<void> {
    if (this.app) {
      await this.app.close();
      console.log('Test auth service stopped');
    }
  }

  async cleanDatabase(): Promise<void> {
    if (this.prisma) {
      await this.prisma.user.deleteMany();
    }
  }

  getApp(): INestApplication {
    return this.app;
  }
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const createTestUser = (): TestUser => ({
  email: `test-${Date.now()}@example.com`,
  password: 'Test123!@#',
  name: 'Test User',
});

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
