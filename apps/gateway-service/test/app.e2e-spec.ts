import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ProxyService } from '../src/proxy/proxy.service';
import { Readable } from 'stream';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let proxyService: { streamRequest: jest.Mock };
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProxyService)
      .useValue({
        forwardRequest: jest.fn(),
        streamRequest: jest.fn(),
      })
      .overrideProvider(HttpService)
      .useValue({
        get: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    proxyService = moduleFixture.get(ProxyService);
    httpService = moduleFixture.get(HttpService);
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/converter/download/:filename (GET)', async () => {
    const mockStream = new Readable();
    mockStream.push('file content');
    mockStream.push(null);

    proxyService.streamRequest.mockResolvedValue(mockStream);

    const authResponse: AxiosResponse = {
      data: { userId: '123' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() },
    };
    httpService.get.mockReturnValue(of(authResponse));

    await request(app.getHttpServer())
      .get('/converter/download/test.mp3')
      .set('Authorization', 'Bearer token')
      .expect(200)
      .expect('file content');

    expect(proxyService.streamRequest).toHaveBeenCalled();
  });
});
