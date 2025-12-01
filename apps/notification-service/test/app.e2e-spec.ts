import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { NotificationController } from '../src/notification/notification.controller';
import { EmailService } from '../src/email/email.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let emailService: { sendEmail: jest.Mock };
  let notificationController: NotificationController;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendEmail: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    emailService = moduleFixture.get(EmailService);
    notificationController = moduleFixture.get<NotificationController>(
      NotificationController,
    );
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('should handle conversion_completed event', async () => {
    const eventData = {
      fileId: '123',
      filename: 'test-video.mp4',
      status: 'completed',
    };

    await notificationController.handleConversionCompleted(eventData);

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Video Conversion Completed',
      'Your video test-video.mp4 has been successfully converted.',
    );
  });
});
