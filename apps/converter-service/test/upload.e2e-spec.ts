import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UploadController (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });

  it('/upload (POST)', async () => {
    return request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('dummy video content'), 'test-video.mp4')
      .expect(201)
      .then((response) => {
        const body = response.body as {
          fileId: string;
          filename: string;
          message: string;
        };
        expect(body).toHaveProperty('fileId');
        expect(body).toHaveProperty('filename');

        expect(body.message).toBe('File uploaded successfully');
      });
  }, 20000);
});
