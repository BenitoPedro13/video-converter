import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Sending email to ${to}...`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body: ${body}`);
    // Mock sending email
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.logger.log(`Email sent to ${to}`);
  }
}
