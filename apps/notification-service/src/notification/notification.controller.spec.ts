import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { EmailService } from '../email/email.service';

describe('NotificationController', () => {
  let controller: NotificationController;
  let emailService: { sendEmail: jest.Mock };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: EmailService,
          useValue: {
            sendEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    emailService = module.get(EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should handle conversion_completed event', async () => {
    const data = {
      fileId: '123',
      filename: 'test.mp4',
      status: 'completed',
    };

    await controller.handleConversionCompleted(data);

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      'user@example.com',
      'Video Conversion Completed',
      'Your video test.mp4 has been successfully converted.',
    );
  });
});
