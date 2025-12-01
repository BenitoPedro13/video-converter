import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ConversionService } from './conversion.service';

@Controller()
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @EventPattern('video_uploaded')
  async handleVideoUploaded(
    @Payload() data: { fileId: string; filename: string },
  ) {
    await this.conversionService.convertVideo(data.fileId, data.filename);
  }
}
