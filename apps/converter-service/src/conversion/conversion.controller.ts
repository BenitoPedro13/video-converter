import { Controller, Get, Param, Res } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { Response } from 'express';
import { ConversionService } from './conversion.service';

@Controller()
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @EventPattern('video_uploaded')
  async handleVideoUploaded(
    @Payload() data: { fileId: string; filename: string },
  ) {
    console.log('Received video_uploaded event:', data);
    await this.conversionService.convertVideo(data.fileId, data.filename);
  }

  @Get('download/:filename')
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const stream = await this.conversionService.downloadFile(filename);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': `attachment; filename="converted-${filename}.mp3"`,
    });
    stream.pipe(res);
  }
}
