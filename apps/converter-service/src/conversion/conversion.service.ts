import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, mongo } from 'mongoose';
import ffmpeg from 'fluent-ffmpeg';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class ConversionService {
  private readonly logger = new Logger(ConversionService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
  ) {}

  async convertVideo(fileId: string, filename: string): Promise<void> {
    this.logger.log(`Starting conversion for file: ${filename} (${fileId})`);

    if (!this.connection.db) {
      throw new Error('Database connection not established');
    }

    const bucket = new mongo.GridFSBucket(this.connection.db, {
      bucketName: 'videos',
    });

    const downloadStream = bucket.openDownloadStream(
      new mongo.ObjectId(fileId),
    );
    const uploadStream = bucket.openUploadStream(`converted-${filename}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg(downloadStream)
        .toFormat('mp3')
        .on('error', (err) => {
          this.logger.error(`Error converting file ${filename}:`, err);
          reject(err);
        })
        .on('end', () => {
          this.logger.log(`Conversion completed for file: ${filename}`);
          this.notificationClient.emit('conversion_completed', {
            fileId,
            filename,
            status: 'completed',
          });
          resolve();
        })
        .pipe(uploadStream);
    });
  }
}
