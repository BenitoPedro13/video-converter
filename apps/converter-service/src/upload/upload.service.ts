import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface GridFsFile extends Express.Multer.File {
  id: string;
}

@Injectable()
export class UploadService {
  constructor(
    @Inject('VIDEO_CONVERSION_SERVICE') private readonly client: ClientProxy,
  ) {}

  handleFileUpload(file: GridFsFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    console.log('Emitting video_uploaded event for file:', file.filename);
    this.client.emit('video_uploaded', {
      fileId: file.id,
      filename: file.filename,
    });

    return {
      message: 'File uploaded successfully',
      fileId: file.id,
      filename: file.filename,
    };
  }
}
