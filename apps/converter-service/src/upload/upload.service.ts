import { Injectable, BadRequestException } from '@nestjs/common';

export interface GridFsFile extends Express.Multer.File {
  id: string;
}

@Injectable()
export class UploadService {
  handleFileUpload(file: GridFsFile) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      message: 'File uploaded successfully',
      fileId: file.id,
      filename: file.filename,
    };
  }
}
