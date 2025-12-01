import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../email/email.service';

interface ConversionCompletedEvent {
  fileId: string;
  filename: string;
  status: string;
}

@Controller()
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('conversion_completed')
  async handleConversionCompleted(@Payload() data: ConversionCompletedEvent) {
    this.logger.log('Received conversion_completed event', data);
    // In a real app, we would look up the user's email based on fileId or userId in data
    // For now, we'll mock it.
    const userEmail = 'user@example.com';
    await this.emailService.sendEmail(
      userEmail,
      'Video Conversion Completed',
      `Your video ${data.filename} has been successfully converted.`,
    );
  }
}
